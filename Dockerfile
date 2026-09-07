# Static Markdown Slides Viewer for Google Cloud Run
FROM nginx:alpine

# Cloud Run sets PORT; listen on 8080 (standard for Cloud Run + nginx)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Viewer app only (courses are loaded via GitHub / Open Folder)
COPY index.html app.js style.css sample-course.md /usr/share/nginx/html/
COPY images/ /usr/share/nginx/html/images/

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
