# Step 1: Use an official Nginx image as the base image
FROM nginx:alpine

# Step 2: Copy your project files into the Nginx container
# This copies everything in your project directory into the Nginx web server's default directory
COPY . /usr/share/nginx/html

# Step 3: Expose port 80 to the outside world
EXPOSE 80

# Step 4: The Nginx image will automatically run Nginx when the container starts
# No need to specify any CMD as the base image already handles it
