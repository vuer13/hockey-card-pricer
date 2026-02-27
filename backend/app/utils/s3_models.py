import boto3
import os


def download_model(s3_key, path):
    """Downloads a model file from S3 to the specified local path."""

    bucket_name = os.getenv("S3_BUCKET")
    region = os.getenv("AWS_REGION")

    if not bucket_name:
        raise ValueError("S3_BUCKET_NAME environment variable is not set.")

    os.makedirs(os.path.dirname(path), exist_ok=True)

    if os.path.exists(path):
        return

    s3 = boto3.client("s3", region_name=region)

    try:
        s3.download_file(bucket_name, s3_key, path)
        print(f"Downloaded {s3_key} to {path}")
    except Exception as e:
        print(f"Error downloading {s3_key} from S3: {e}")
        raise
