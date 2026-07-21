<!-- The comment element below (course-title) is used to set the title in the footer of the slides. -->
<!-- course-title: 815: Hands-On Terraform -->

<!-- This is the Course Title Slide -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)


# Course 815:
# Hands-On Terraform

---
<!-- If no layout is specified, it uses a default layout -->
# Course Objectives

In this course, you will:

- Automate the creation, management, and destruction of computing infrastructure and resources using Terraform
- Create infrastructure as code with HashiCorp Configuration Language (HCL)
- Provision AWS, Azure, and Google Cloud resources using Terraform
- Build complex, reusable deployments using Terraform modules
- Leverage Terraform to deploy Kubernetes applications
- Simplify using Terraform in teams using Terraform Cloud

---
<!-- This is the Chapter Title Slide -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

815: Hands-On Terraform

# Chapter 1: Infrastructure as Code & Multi-Cloud Provisioning

---
<!-- Example of a Navigation Slide. Use the navigation layout to denote chapter sections. -->
<!-- layout: navigation -->
# Chapter Concepts

- **Providers**
- Folder Structure
- Workflow
- Managing State

---

# Chapter Objectives

In this chapter, you will:

- Learn how Terraform is used to provide Infrastructure as Code (IaC)
- Install and configure Terraform for use with AWS, Azure, and Google Cloud
- Understand state management, plan validation, and provider architecture

---

# What is Infrastructure as Code?

Infrastructure as Code (IaC) allows developers and ops teams to manage cloud resources using declarative configuration files.

### Key Benefits:
- **Consistency**: Eliminates configuration drift across environments
- **Automation**: Provision compute, storage, and networking programmatically
- **Version Control**: Track infrastructure changes in Git repositories

> [!NOTE]
> IaC configuration files serve as living documentation for your cloud architecture.

---
<!-- A Slide with an Image Automatically uses a 2-column layout. -->
# Infrastructure Architecture Diagram

- **Declarative Configuration**: Define target cloud resources in HCL files
- **State Management**: Track deployed resources in local or remote state backends
- **Execution Plan**: Preview resource additons, modifications, and deletions before applying

![Terraform Architecture Diagram](images/sample-diagram.png)

---

<!-- layout: navigation -->
# Chapter Concepts

- Providers
- **Folder Structure**
- Workflow
- Managing State

---

# Collaborative Infrastructure Teams

- **Team Coordination**: Enable multiple engineers to work on infrastructure safely
- **Code Review**: PR-based workflow for infrastructure changes
- **Automated Testing**: Validate syntax and security policies in CI/CD pipelines

![Engineering Team Collaboration](images/sample-team-of-programmers.png)

---

# Terraform Configuration Syntax

Terraform uses HashiCorp Configuration Language (HCL) to define resources:

```hcl
provider "google" {
  project = "roi-training-demo"
  region  = "us-central1"
}

resource "google_compute_instance" "default" {
  name         = "terraform-instance"
  machine_type = "e2-medium"
  zone         = "us-central1-a"

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-11"
    }
  }

  network_interface {
    network = "default"
  }
}
```

> [!TIP]
> Use `terraform fmt` to automatically format HCL files according to standard conventions.

---

# Cloud Provider Ecosystem

Terraform supports all major cloud platforms through Provider plugins:

| Cloud Provider | Primary Use Case | Popular Resources |
| :--- | :--- | :--- |
| **Google Cloud** | Compute Engine, GKE, BigQuery | `google_compute_instance`, `google_container_cluster` |
| **AWS** | EC2, S3, EKS, Lambda | `aws_instance`, `aws_s3_bucket` |
| **Microsoft Azure** | Virtual Machines, AKS, Blob Storage | `azurerm_virtual_machine`, `azurerm_storage_account` |

> [!IMPORTANT]
> Refer to the [Terraform Provider Documentation](https://registry.terraform.io/providers/hashicorp/google/latest/docs) for detailed information on available resources and their configuration options.

---

# Hands-On Lab
20 minutes


### Click the link below to do the Hands-on Lab for Chapter 1.

 - [Sample Lab](https://roitraining.github.io/md-to-html-lab-viewer/?lab=https://github.com/GoogleCloudPlatform/specialized-training-content/blob/main/courses/explore-ai-for-activation/1-gemini-for-image-video-and-audio-analysis/1-ice-breaker/image-ice-breaker.md)


---

# Summary

### What We Covered:
1. Core concepts of Infrastructure as Code
2. HCL syntax and resource declaration
3. Multi-cloud provider integration

