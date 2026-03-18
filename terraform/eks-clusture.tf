module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 21.0"

  name               = local.cluster_name
  kubernetes_version = "1.33"

  addons = {
    coredns = {}
    eks-pod-identity-agent = {
      before_compute = true
    }
    kube-proxy = {}
    vpc-cni = {
      before_compute = true
    }
  }

  enable_cluster_creator_admin_permissions = true

  vpc_id                  = module.vpc.vpc_id
  subnet_ids              = module.vpc.private_subnets
  endpoint_private_access = true
  endpoint_public_access  = true


  access_entries = {
    jenkins_role = {
      kubernetes_groups = []
      # Use the exact ARN shown in your IAM console screenshot:
      principal_arn     = "arn:aws:iam::109714237020:role/jenkins-to-eks-role" 
      
      policy_associations = {
        admin = {
          policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
          access_scope = {
            type = "cluster"
          }
        }
      }
    }
  }
  eks_managed_node_groups = {
    one = {
      name           = "node-group-1"
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 3
      desired_size = 2
    }

    two = {
      name           = "node-group-2"
      ami_type       = "AL2023_x86_64_STANDARD"
      instance_types = ["t3.small"]

      min_size     = 1
      max_size     = 2
      desired_size = 1
    }
  }
}