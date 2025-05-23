import unittest
import json
import main # Assuming your Flask app instance is named 'app' in main.py
from werkzeug.exceptions import BadRequest
from googleapiclient.errors import HttpError
from unittest.mock import patch

class TestErrorHandling(unittest.TestCase):

    def setUp(self):
        main.app.testing = True
        self.client = main.app.test_client()

    def test_malformed_json(self):
        """Test response when JSON payload is malformed."""
        response = self.client.post('/process',
                                     data=b"{'key': 'value',", # Invalid JSON
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response_data, {"error": "Malformed JSON payload"})

    def test_invalid_folder_id_type(self):
        """Test response when folderId is not a string."""
        payload = {"folderId": 123, "data": [{"question": "q", "answer": "a"}]}
        response = self.client.post('/process',
                                     data=json.dumps(payload),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response_data, {"error": "Invalid 'folderId': must be a string."})

    def test_missing_folder_id(self):
        """Test response when folderId is missing from the payload."""
        payload = {"data": [{"question": "q", "answer": "a"}]} # Missing folderId
        response = self.client.post('/process',
                                     data=json.dumps(payload),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response_data, {"error": "Invalid or missing 'folderId' in request data."})

    @patch('main.authenticate_drive')
    def test_google_api_http_error(self, mock_auth_drive):
        """Test response when Google API raises an HttpError."""
        # Configure the mock to raise an HttpError
        mock_resp = type('MockResp', (), {'status': 403, 'reason': 'Forbidden'})()
        error_content = json.dumps({"error": {"code": 403, "message": "User does not have permission."}})
        http_error = HttpError(resp=mock_resp, content=error_content.encode('utf-8'))
        mock_auth_drive.side_effect = http_error

        payload = {"folderId": "some_folder_id", "data": [{"question": "q", "answer": "a"}]}
        response = self.client.post('/process',
                                     data=json.dumps(payload),
                                     content_type='application/json')
        
        self.assertEqual(response.status_code, 403)
        response_data = json.loads(response.data.decode('utf-8'))
        expected_error_response = {
            "error": "Google API Error: Status 403",
            "details": "User does not have permission."
        }
        self.assertEqual(response_data, expected_error_response)

    def test_no_data_provided(self):
        """Test response when 'data' array is empty."""
        payload = {"folderId": "some_id", "data": []}
        response = self.client.post('/process',
                                     data=json.dumps(payload),
                                     content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = json.loads(response.data.decode('utf-8'))
        self.assertEqual(response_data, {"error": "No question-answer data provided"})

if __name__ == '__main__':
    unittest.main()
