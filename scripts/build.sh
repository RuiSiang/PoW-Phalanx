#!bin/bash
cp -n .env.example .env && \
echo "Starting Build..." && \
tsc && \
echo "Build Successful!" && \
# echo "Copying Files..." && \
echo "Success!"