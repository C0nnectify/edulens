"""
Unit tests for faculty_scraper.py
Run with: pytest test_faculty_scraper.py -v
"""

import pytest
import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from faculty_scraper import FacultyScraper, FacultyExtractor


@pytest.fixture
def sample_config():
    """Sample configuration for testing"""
    return {
        "universities": [
            {
                "id": "test_university",
                "name": "Test University",
                "short_name": "TU",
                "departments": [
                    {
                        "name": "Computer Science",
                        "code": "cs",
                        "faculty_url": "https://test.edu/faculty",
                        "selectors": {
                            "faculty_list": ".faculty",
                            "name": ".name",
                            "email": ".email"
                        }
                    }
                ]
            }
        ],
        "scraping_config": {
            "rate_limit_delay": 0.1,
            "max_retries": 2,
            "timeout": 10,
            "user_agent": "Test Bot"
        },
        "ai_extraction_config": {
            "model": "gemini-2.0-flash-exp",
            "temperature": 0.1,
            "max_tokens": 2000
        }
    }


@pytest.fixture
def sample_html():
    """Sample HTML for testing"""
    return """
    <html>
        <body>
            <div class="faculty">
                <span class="name">Dr. John Doe</span>
                <span class="email">jdoe@test.edu</span>
                <span class="title">Professor</span>
            </div>
            <div class="faculty">
                <span class="name">Dr. Jane Smith</span>
                <span class="email">jsmith@test.edu</span>
                <span class="title">Associate Professor</span>
            </div>
        </body>
    </html>
    """


@pytest.fixture
def sample_progress():
    """Sample progress data"""
    return {
        "last_university": None,
        "last_department": None,
        "completed": [],
        "failed": [],
        "total_faculty_scraped": 0
    }


class TestFacultyExtractor:
    """Tests for FacultyExtractor class"""

    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_init_with_api_key(self, mock_model, mock_configure):
        """Test initialization with API key"""
        extractor = FacultyExtractor(api_key="test_key")
        mock_configure.assert_called_once_with(api_key="test_key")
        assert extractor.api_key == "test_key"

    @patch.dict('os.environ', {'GOOGLE_API_KEY': 'env_key'})
    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_init_with_env_key(self, mock_model, mock_configure):
        """Test initialization with environment variable"""
        extractor = FacultyExtractor()
        assert extractor.api_key == "env_key"

    def test_init_without_key(self):
        """Test initialization fails without API key"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="Google API key not found"):
                FacultyExtractor()

    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_extract_faculty_info_valid_response(self, mock_model_class, mock_configure):
        """Test successful faculty extraction"""
        # Mock AI response
        mock_response = Mock()
        mock_response.text = json.dumps([
            {
                "name": "Dr. John Doe",
                "email": "jdoe@test.edu",
                "title": "Professor",
                "research_areas": ["AI", "ML"]
            }
        ])

        mock_model = Mock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        extractor = FacultyExtractor(api_key="test_key")
        result = extractor.extract_faculty_info("<html>test</html>", "https://test.edu")

        assert len(result) == 1
        assert result[0]["name"] == "Dr. John Doe"
        assert result[0]["email"] == "jdoe@test.edu"

    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_extract_faculty_info_markdown_response(self, mock_model_class, mock_configure):
        """Test extraction with markdown-formatted response"""
        mock_response = Mock()
        mock_response.text = "```json\n" + json.dumps([{"name": "Test"}]) + "\n```"

        mock_model = Mock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        extractor = FacultyExtractor(api_key="test_key")
        result = extractor.extract_faculty_info("<html>test</html>", "https://test.edu")

        assert len(result) == 1
        assert result[0]["name"] == "Test"

    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_extract_faculty_info_invalid_json(self, mock_model_class, mock_configure):
        """Test extraction with invalid JSON response"""
        mock_response = Mock()
        mock_response.text = "This is not valid JSON"

        mock_model = Mock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        extractor = FacultyExtractor(api_key="test_key")
        result = extractor.extract_faculty_info("<html>test</html>", "https://test.edu")

        assert result == []


class TestFacultyScraper:
    """Tests for FacultyScraper class"""

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    def test_load_config(self, mock_extractor, mock_mongo, tmp_path, sample_config):
        """Test configuration loading"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        progress_file.write_text('{}')

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))
            assert scraper.config == sample_config

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    def test_parse_with_selectors(self, mock_extractor, mock_mongo, tmp_path, sample_config, sample_html):
        """Test HTML parsing with CSS selectors"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        progress_file.write_text('{}')

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))

            selectors = {
                "faculty_list": ".faculty",
                "name": ".name",
                "email": ".email",
                "title": ".title"
            }

            result = scraper.parse_with_selectors(sample_html, selectors)

            assert len(result) == 2
            assert result[0]["name"] == "Dr. John Doe"
            assert result[0]["email"] == "jdoe@test.edu"
            assert result[1]["name"] == "Dr. Jane Smith"

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    def test_generate_faculty_hash(self, mock_extractor, mock_mongo, tmp_path, sample_config):
        """Test faculty hash generation"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        progress_file.write_text('{}')

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))

            hash1 = scraper.generate_faculty_hash("mit", "cs", "test@mit.edu")
            hash2 = scraper.generate_faculty_hash("mit", "cs", "test@mit.edu")
            hash3 = scraper.generate_faculty_hash("stanford", "cs", "test@mit.edu")

            # Same input should produce same hash
            assert hash1 == hash2
            # Different input should produce different hash
            assert hash1 != hash3
            # Hash should be 16 characters
            assert len(hash1) == 16

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    def test_rate_limit_delay(self, mock_extractor, mock_mongo, tmp_path, sample_config):
        """Test rate limiting"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        progress_file.write_text('{}')

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))

            import time
            start = time.time()

            scraper.rate_limit_delay()
            scraper.rate_limit_delay()

            elapsed = time.time() - start

            # Should have delayed at least once
            assert elapsed >= 0.1

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    @patch('requests.Session.get')
    def test_fetch_with_requests_success(self, mock_get, mock_extractor, mock_mongo, tmp_path, sample_config, sample_html):
        """Test successful fetch with requests"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        progress_file.write_text('{}')

        mock_response = Mock()
        mock_response.text = sample_html
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))
            result = scraper.fetch_with_requests("https://test.edu")

            assert result == sample_html
            mock_get.assert_called_once()

    @patch('faculty_scraper.FacultyScraper.setup_mongodb')
    @patch('faculty_scraper.FacultyExtractor')
    def test_save_and_load_progress(self, mock_extractor, mock_mongo, tmp_path, sample_config):
        """Test progress saving and loading"""
        config_file = tmp_path / "test_config.json"
        config_file.write_text(json.dumps(sample_config))

        progress_file = tmp_path / "progress.json"
        initial_progress = {
            "last_university": "mit",
            "completed": ["mit:cs"],
            "total_faculty_scraped": 50
        }
        progress_file.write_text(json.dumps(initial_progress))

        with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
            scraper = FacultyScraper(str(config_file), str(progress_file))

            # Check loaded progress
            assert scraper.progress["last_university"] == "mit"
            assert scraper.progress["total_faculty_scraped"] == 50

            # Update and save
            scraper.progress["total_faculty_scraped"] = 75
            scraper.save_progress()

            # Load again and verify
            scraper2 = FacultyScraper(str(config_file), str(progress_file))
            assert scraper2.progress["total_faculty_scraped"] == 75


def test_parse_with_empty_selectors():
    """Test parsing with empty selectors"""
    from faculty_scraper import FacultyScraper

    with patch('faculty_scraper.FacultyScraper.setup_mongodb'):
        with patch('faculty_scraper.FacultyExtractor'):
            with patch.dict('os.environ', {'GOOGLE_API_KEY': 'test'}):
                scraper = FacultyScraper.__new__(FacultyScraper)
                result = scraper.parse_with_selectors("<html>test</html>", {})
                assert result == []


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
