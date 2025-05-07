#!/bin/bash

# Svelte Games Framework Deployment Script
# This script builds the application and prepares it for deployment

# ANSI color codes for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print step information
print_step() {
  echo -e "${BLUE}==== ${1} ====${NC}"
}

# Function to print success message
print_success() {
  echo -e "${GREEN}✓ ${1}${NC}"
}

# Function to print error message and exit
print_error() {
  echo -e "${RED}✗ ${1}${NC}"
  exit 1
}

# Print welcome message
echo -e "${YELLOW}Svelte Games Framework Deployment${NC}"
echo -e "${BLUE}Starting deployment process...${NC}"
echo ""

# Step 1: Install dependencies
print_step "Installing dependencies"
npm install || print_error "Failed to install dependencies"
print_success "Dependencies installed"
echo ""

# Step 2: Run type check
print_step "Running type check"
npm run check || print_error "Type check failed"
print_success "Type check passed"
echo ""

# Step 3: Build the application
print_step "Building application"
npm run build || print_error "Build failed"
print_success "Build completed"
echo ""

# Step 4: Prepare distribution folder
print_step "Preparing distribution"
DIST_FOLDER="dist"

# Create dist folder if it doesn't exist
mkdir -p $DIST_FOLDER

# Copy build output to dist folder
cp -r dist/* $DIST_FOLDER/
print_success "Distribution prepared"
echo ""

# Print success message
echo -e "${GREEN}Deployment preparation completed successfully!${NC}"
echo -e "${BLUE}You can find the built application in the '${DIST_FOLDER}' folder.${NC}"
echo -e "${BLUE}To run the built application locally:${NC}"
echo -e "${YELLOW}npm run preview${NC}"
echo ""
echo -e "${BLUE}To deploy to a server, copy the contents of the '${DIST_FOLDER}' folder to your server.${NC}"