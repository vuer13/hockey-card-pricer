import logging
import os

import boto3
from botocore.exceptions import BotoCoreError, ClientError

S3_BUCKET = os.getenv('S3_BUCKET')
AWS_REGION = os.getenv('AWS_REGION')

s3 = boto3.client('s3', region_name=AWS_REGION)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('app')


def upload_image(local_path, s3_key):
    try:
        s3.upload_file(local_path, S3_BUCKET, s3_key)
        return s3_key
    except (BotoCoreError, ClientError):
        logger.error('s3_upload_failed', exc_info=True)
        raise RuntimeError('S3_UPLOAD_FAILED')
