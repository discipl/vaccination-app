**Backend**:

For deploying project we use Kubernetes cluster. So short workflow of deploying is next:
1) Build image of service
2) Upload image to Docker Registry
3) Updating config of service at Kubernetes cluster

Kubernetes cluster can be deployed in several ways:
1) At cloud
2) At physical computers

In both way the simplest way of deploying is using special stuff for managing clusters. We use Rancher.
Using it it’s possible to deploy clusters, manage resources, configure notifications and so on.

So once cluster will be ready you can use deploy files from repository for deploy service.

**Frontend:**

For running frontend any web server can be used: IIS, NGINX, Apache and so on.
We use cloud variant of IIS at Azure - Azure WebApp.

So workflow of deploying is next:
1) Building project (include downloading packages, running prebuilt scripts, building files)
2) Uploading build artefacts to temporary server - for checking build and reducing downtime
3) Moving artefacts from temporary server to main server

At WebApp moving artefacts between servers is pretty simple and fast, other system can be difficult. 

Because we doesn’t know your plans  regarding deploy (will you use cloud or not, which cloud you will use and so on) we can’t provide detailed workflow for deploy. 

