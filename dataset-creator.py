'''
Author: woodfor woodforlol@gmail.com
Date: 2022-12-07 19:28:12
LastEditors: woodfor woodforlol@gmail.com
LastEditTime: 2022-12-07 19:33:23
FilePath: \pr-reminder\PR-reminder\dataset-creator.py
Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
'''
import requests

# Set the repository and authentication parameters
repo = 'owner/repo'
auth = ('username', 'password')

# Get the pull requests for the repository
response = requests.get(f'https://api.github.com/repos/{repo}/pulls', auth=auth)

# Parse the pull requests from the response
pull_requests = response.json()

print(pull_requests)

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