import boto3
import os

S3_BUCKET = os.getenv("S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION")

s3 = boto3.client("s3", region_name=AWS_REGION)


def upload_image(local_path, s3_key):
    try:
        s3.upload_file(local_path, S3_BUCKET, s3_key)
        return s3_key
    except (BotoCoreError, ClientError) as e:
        logger.error("s3_upload_failed", exc_info=True)
        raise RuntimeError("S3_UPLOAD_FAILED")
