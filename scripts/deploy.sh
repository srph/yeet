#!/bin/bash

# Deploy script - toggles the "deploy" file
# If it exists, remove it; if not, create it

if [ -f "deploy" ]; then
    echo "Deploy file exists, removing it..."
    rm deploy
    echo "Deploy file removed ✅"
else
    echo "Deploy file doesn't exist, creating it..."
    touch deploy
    echo "Deploy file created ✅"
fi
