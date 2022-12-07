'''
Author: woodfor woodforlol@gmail.com
Date: 2022-12-07 19:28:12
'''
import requests
import os
from dotenv import load_dotenv

# Set the repository and authentication parameters
load_dotenv()
repo = os.environ['repo']
access_token = os.environ['git_repo_token']
auth = f"Bearer {access_token}"
# Get the pull requests for the repository
headers = {
    'Authorization': auth
}
response = requests.get(
    f'https://api.github.com/repos/{repo}/pulls', headers=headers)

print(response)
# # Parse the pull requests from the response
# pull_requests = response.json()


# print(pull_requests)


# For each pull request, get the comments
# for pull_request in pull_requests:
#   # Get the comments for the pull request
#   response = requests.get(pull_request['comments_url'], auth=auth)

#   # Parse the comments from the response
#   comments = response.json()

#   # Process the comments and add them to the dataset
#   for comment in comments:
#     # Check if the comment was made by your colleague
#     is_from_colleague = comment['user']['login'] == 'colleague'

#     # Add the comment to the dataset
#     dataset.append({
#       'pull_request_id': pull_request['id'],
#       'comment': comment['body'],
#       'is_from_colleague': is_from_colleague
#     })
