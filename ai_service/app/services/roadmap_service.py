"""
Roadmap service for loading and serving Dream Mode stage configurations
"""

import json
import os
from typing import List, Optional
from pathlib import Path
from functools import lru_cache

from app.models.roadmap import StageConfig
import logging

logger = logging.getLogger(__name__)


class RoadmapService:
    """Service for managing roadmap stage data"""
    
    def __init__(self):
        self._stages: List[StageConfig] = []
        self._stages_by_id: dict[str, StageConfig] = {}
        self._stages_by_order: dict[int, StageConfig] = {}
        self._loaded = False
    
    def load_stages(self) -> None:
        """Load stages from JSON file and cache in memory"""
        if self._loaded:
            return
        
        try:
            # Get path to stages JSON file
            data_dir = Path(__file__).parent.parent / "data"
            stages_file = data_dir / "dream_mode_stages.json"
            
            if not stages_file.exists():
                logger.error(f"Stages file not found: {stages_file}")
                raise FileNotFoundError(f"Stage configuration file not found: {stages_file}")
            
            # Load and parse JSON
            with open(stages_file, 'r', encoding='utf-8') as f:
                stages_data = json.load(f)
            
            # Validate and create StageConfig objects
            self._stages = [StageConfig(**stage) for stage in stages_data]
            
            # Sort by order
            self._stages.sort(key=lambda s: s.order)
            
            # Create lookup dictionaries
            self._stages_by_id = {stage.id: stage for stage in self._stages}
            self._stages_by_order = {stage.order: stage for stage in self._stages}
            
            self._loaded = True
            logger.info(f"Successfully loaded {len(self._stages)} roadmap stages")
            
        except Exception as e:
            logger.error(f"Failed to load stages: {e}")
            raise
    
    def get_all_stages(self) -> List[StageConfig]:
        """Get all stages in order"""
        if not self._loaded:
            self.load_stages()
        return self._stages.copy()
    
    def get_stage_by_id(self, stage_id: str) -> Optional[StageConfig]:
        """Get a specific stage by ID"""
        if not self._loaded:
            self.load_stages()
        return self._stages_by_id.get(stage_id)
    
    def get_stage_by_order(self, order: int) -> Optional[StageConfig]:
        """Get a specific stage by order number (1-12)"""
        if not self._loaded:
            self.load_stages()
        return self._stages_by_order.get(order)
    
    def get_total_stages(self) -> int:
        """Get total number of stages"""
        if not self._loaded:
            self.load_stages()
        return len(self._stages)


# Global service instance
roadmap_service = RoadmapService()
