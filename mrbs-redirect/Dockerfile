FROM nginx:alpine

# Copy our configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fly.io listens on 8080 by default in their proxy
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
