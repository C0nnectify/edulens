#!/usr/bin/env python3
"""
Analyze scraped admission results
Provides statistics and insights from the collected data
"""

import argparse
from collections import defaultdict, Counter
from datetime import datetime
from typing import List, Dict, Any
import statistics

from pymongo import MongoClient
from rich.console import Console
from rich.table import Table
from rich import print as rprint
import json

console = Console()


class AdmissionAnalyzer:
    """Analyze admission results from MongoDB"""

    def __init__(self, config_path: str = "reddit_config.json"):
        with open(config_path, 'r') as f:
            config = json.load(f)

        mongo_config = config['mongodb']
        client = MongoClient(mongo_config['uri'])
        db = client[mongo_config['database']]
        self.collection = db[mongo_config['collection']]

    def get_total_results(self) -> int:
        """Get total number of results"""
        return self.collection.count_documents({})

    def get_decision_breakdown(self) -> Dict[str, int]:
        """Get breakdown by decision type"""
        pipeline = [
            {"$group": {"_id": "$decision", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        results = list(self.collection.aggregate(pipeline))
        return {r['_id']: r['count'] for r in results if r['_id']}

    def get_university_stats(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get stats by university"""
        pipeline = [
            {"$match": {"university": {"$ne": None}}},
            {"$group": {
                "_id": "$university",
                "total": {"$sum": 1},
                "accepted": {
                    "$sum": {"$cond": [{"$eq": ["$decision", "Accepted"]}, 1, 0]}
                },
                "rejected": {
                    "$sum": {"$cond": [{"$eq": ["$decision", "Rejected"]}, 1, 0]}
                }
            }},
            {"$sort": {"total": -1}},
            {"$limit": limit}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_program_stats(self, limit: int = 15) -> List[Dict[str, Any]]:
        """Get stats by program"""
        pipeline = [
            {"$match": {"program": {"$ne": None}}},
            {"$group": {"_id": "$program", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_gpa_stats(self) -> Dict[str, float]:
        """Get GPA statistics"""
        results = list(self.collection.find(
            {"profile.gpa": {"$exists": True, "$ne": None}},
            {"profile.gpa": 1, "decision": 1}
        ))

        if not results:
            return {}

        gpas = [r['profile']['gpa'] for r in results]
        accepted_gpas = [r['profile']['gpa'] for r in results if r.get('decision') == 'Accepted']
        rejected_gpas = [r['profile']['gpa'] for r in results if r.get('decision') == 'Rejected']

        stats = {
            "count": len(gpas),
            "mean": statistics.mean(gpas),
            "median": statistics.median(gpas),
            "min": min(gpas),
            "max": max(gpas)
        }

        if accepted_gpas:
            stats["accepted_mean"] = statistics.mean(accepted_gpas)
        if rejected_gpas:
            stats["rejected_mean"] = statistics.mean(rejected_gpas)

        return stats

    def get_gre_stats(self) -> Dict[str, Any]:
        """Get GRE statistics"""
        results = list(self.collection.find(
            {"profile.gre_scores": {"$exists": True}},
            {"profile.gre_scores": 1, "decision": 1}
        ))

        if not results:
            return {}

        quants = [r['profile']['gre_scores'].get('quant') for r in results
                  if r['profile']['gre_scores'].get('quant')]
        verbals = [r['profile']['gre_scores'].get('verbal') for r in results
                   if r['profile']['gre_scores'].get('verbal')]

        stats = {"count": len(results)}

        if quants:
            stats["quant"] = {
                "mean": statistics.mean(quants),
                "median": statistics.median(quants),
                "min": min(quants),
                "max": max(quants)
            }

        if verbals:
            stats["verbal"] = {
                "mean": statistics.mean(verbals),
                "median": statistics.median(verbals),
                "min": min(verbals),
                "max": max(verbals)
            }

        return stats

    def get_timeline_stats(self) -> List[Dict[str, Any]]:
        """Get results by month"""
        pipeline = [
            {"$group": {
                "_id": {
                    "year": {"$year": {"$dateFromString": {"dateString": "$post_date"}}},
                    "month": {"$month": {"$dateFromString": {"dateString": "$post_date"}}}
                },
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id.year": -1, "_id.month": -1}},
            {"$limit": 12}
        ]
        return list(self.collection.aggregate(pipeline))

    def get_funding_stats(self) -> Dict[str, int]:
        """Get funding statistics"""
        total = self.collection.count_documents({"decision": "Accepted"})
        with_funding = self.collection.count_documents({
            "decision": "Accepted",
            "funding": {"$ne": None}
        })

        return {
            "total_accepted": total,
            "with_funding": with_funding,
            "percentage": (with_funding / total * 100) if total > 0 else 0
        }

    def get_international_stats(self) -> Dict[str, int]:
        """Get international student statistics"""
        total = self.get_total_results()
        international = self.collection.count_documents({
            "profile.is_international": True
        })

        return {
            "total": total,
            "international": international,
            "percentage": (international / total * 100) if total > 0 else 0
        }

    def print_summary(self):
        """Print comprehensive summary"""
        console.print("\n[bold cyan]Admission Results Analysis[/bold cyan]\n")

        # Total results
        total = self.get_total_results()
        console.print(f"[green]Total Results:[/green] {total}\n")

        if total == 0:
            console.print("[yellow]No results found. Run the scraper first.[/yellow]")
            return

        # Decision breakdown
        console.print("[bold]Decision Breakdown[/bold]")
        decisions = self.get_decision_breakdown()
        decision_table = Table()
        decision_table.add_column("Decision", style="cyan")
        decision_table.add_column("Count", style="magenta")
        decision_table.add_column("Percentage", style="green")

        for decision, count in decisions.items():
            pct = (count / total * 100)
            decision_table.add_row(decision, str(count), f"{pct:.1f}%")

        console.print(decision_table)
        console.print()

        # Top universities
        console.print("[bold]Top Universities[/bold]")
        universities = self.get_university_stats(limit=15)
        uni_table = Table()
        uni_table.add_column("University", style="cyan")
        uni_table.add_column("Total", style="magenta")
        uni_table.add_column("Accepted", style="green")
        uni_table.add_column("Rejected", style="red")

        for uni in universities:
            uni_table.add_row(
                uni['_id'],
                str(uni['total']),
                str(uni['accepted']),
                str(uni['rejected'])
            )

        console.print(uni_table)
        console.print()

        # GPA statistics
        gpa_stats = self.get_gpa_stats()
        if gpa_stats:
            console.print("[bold]GPA Statistics[/bold]")
            gpa_table = Table()
            gpa_table.add_column("Metric", style="cyan")
            gpa_table.add_column("Value", style="magenta")

            gpa_table.add_row("Profiles with GPA", str(gpa_stats['count']))
            gpa_table.add_row("Mean GPA", f"{gpa_stats['mean']:.2f}")
            gpa_table.add_row("Median GPA", f"{gpa_stats['median']:.2f}")
            gpa_table.add_row("Range", f"{gpa_stats['min']:.2f} - {gpa_stats['max']:.2f}")

            if 'accepted_mean' in gpa_stats:
                gpa_table.add_row("Mean (Accepted)", f"{gpa_stats['accepted_mean']:.2f}")
            if 'rejected_mean' in gpa_stats:
                gpa_table.add_row("Mean (Rejected)", f"{gpa_stats['rejected_mean']:.2f}")

            console.print(gpa_table)
            console.print()

        # GRE statistics
        gre_stats = self.get_gre_stats()
        if gre_stats and gre_stats.get('count', 0) > 0:
            console.print("[bold]GRE Statistics[/bold]")
            gre_table = Table()
            gre_table.add_column("Section", style="cyan")
            gre_table.add_column("Mean", style="magenta")
            gre_table.add_column("Median", style="green")
            gre_table.add_column("Range", style="yellow")

            if 'quant' in gre_stats:
                q = gre_stats['quant']
                gre_table.add_row(
                    "Quantitative",
                    f"{q['mean']:.1f}",
                    f"{q['median']:.1f}",
                    f"{q['min']}-{q['max']}"
                )

            if 'verbal' in gre_stats:
                v = gre_stats['verbal']
                gre_table.add_row(
                    "Verbal",
                    f"{v['mean']:.1f}",
                    f"{v['median']:.1f}",
                    f"{v['min']}-{v['max']}"
                )

            console.print(gre_table)
            console.print()

        # Funding statistics
        funding_stats = self.get_funding_stats()
        console.print("[bold]Funding Information[/bold]")
        console.print(f"Accepted with funding info: {funding_stats['with_funding']} / {funding_stats['total_accepted']} ({funding_stats['percentage']:.1f}%)")
        console.print()

        # International students
        intl_stats = self.get_international_stats()
        console.print("[bold]International Students[/bold]")
        console.print(f"International: {intl_stats['international']} / {intl_stats['total']} ({intl_stats['percentage']:.1f}%)")
        console.print()

    def export_analysis(self, output_path: str):
        """Export analysis to JSON"""
        analysis = {
            "generated_at": datetime.utcnow().isoformat(),
            "total_results": self.get_total_results(),
            "decisions": self.get_decision_breakdown(),
            "universities": self.get_university_stats(),
            "programs": self.get_program_stats(),
            "gpa_stats": self.get_gpa_stats(),
            "gre_stats": self.get_gre_stats(),
            "funding_stats": self.get_funding_stats(),
            "international_stats": self.get_international_stats()
        }

        with open(output_path, 'w') as f:
            json.dump(analysis, f, indent=2, default=str)

        console.print(f"[green]Analysis exported to {output_path}[/green]")


def main():
    """Main CLI"""
    parser = argparse.ArgumentParser(description="Analyze admission results")

    parser.add_argument(
        '--export',
        type=str,
        help='Export analysis to JSON file'
    )

    parser.add_argument(
        '--config',
        type=str,
        default='reddit_config.json',
        help='Path to config file'
    )

    args = parser.parse_args()

    try:
        analyzer = AdmissionAnalyzer(args.config)
        analyzer.print_summary()

        if args.export:
            analyzer.export_analysis(args.export)

    except Exception as e:
        console.print(f"[red]Error: {e}[/red]")


if __name__ == "__main__":
    main()
