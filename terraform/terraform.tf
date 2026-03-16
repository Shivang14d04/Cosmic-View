terraform {
  required_version = ">= 1.5.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28"
    }

    random = {
      source  = "hashicorp/random"
      version = ">= 3.4"
    }

    tls = {
      source  = "hashicorp/tls"
      version = ">= 4.0"
    }

    time = {
      source  = "hashicorp/time"
      version = ">= 0.9"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = ">= 2.16"
    }
  }

  backend "s3" {
    bucket = "cosmic-view-terraform-eks-state-bucket"
    key    = "state/terraform.tfstate"
    region = "us-east-1"
  }
}