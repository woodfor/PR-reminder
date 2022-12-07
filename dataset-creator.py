'''
Author: woodfor woodforlol@gmail.com
Date: 2022-12-07 19:28:12
'''
import requests
import csv
import os
from dotenv import load_dotenv

# Set the repository and authentication parameters
load_dotenv()
repo = os.environ['repo']
access_token = os.environ['git_repo_token']
owner = os.environ['owner']

# Get the pull requests for the repository
headers = {
    'Authorization': f"Bearer {access_token}"
}
response = requests.get(
    f'https://api.github.com/repos/{owner}/{repo}/pulls', headers=headers)

# Parse the pull requests from the response
pull_requests = response.json()

with open('my_file.csv', 'w') as f:
    writer = csv.DictWriter(
        f, fieldnames=['pull_request_id', 'comment', 'user'])
    writer.writeheader()
    # For each pull request, get the comments
    for pull_request in pull_requests:
        # Get the comments for the pull request
        response = requests.get(
            pull_request['comments_url'], headers=headers)

        # Parse the comments from the response
        comments = response.json()

        # Process the comments and add them to the dataset
        for comment in comments:
            # Check if the comment was made by your colleague
            user = comment['user']['login']

            # Add the comment to the dataset
            row = {
                'pull_request_id': pull_request['id'],
                'comment': comment['body'],
                'user': user
            }
            print(row)
            writer.writerow(row)
