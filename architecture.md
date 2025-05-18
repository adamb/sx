# Selfie.pr System Architecture

## Overview

Selfie.pr is a web application that allows users to create personalized AI models from their photos and generate new images using these models. The system integrates multiple services and technologies to provide a seamless user experience.

## Core Components

### Authentication
- Dual authentication methods:
  - Facebook OAuth integration for social login
  - Email-based magic link authentication
- JWT tokens for session management
- User data stored in Cloudflare KV storage
- Unified user identification system:
  - Facebook users: Uses Facebook ID directly
  - Email users: Generated from hashed email (16-char hex)
- Common key structure: `{userId}.{modelId}_{predictionId}`
  - userId: Facebook ID or email hash
  - modelId: Timestamp of model creation
  - predictionId: Unique identifier for each generation

### Image Management
- **Bytescale**: Handles image uploads and ZIP file creation
  - Used for temporary storage of training images
  - Provides ZIP file creation API for bundling training images
  - [TODO: Add details about image storage limits and retention policy]

### Model Training
- **Replicate**: Powers the AI model training and image generation
  - Uses Flux for training personalized models
  - Handles model inference for generating new images
  - [TODO: Add details about model architecture and training parameters]

### Data Storage
- **Cloudflare KV**: Primary data store
  - User data storage:
    - Facebook users: `facebook.{facebookId}` namespace
      - Includes prediction stats (total_predict_time, prediction_count)
    - Email users: `email.{emailHash}` namespace
  - Model data: `{userId}.{timestamp}` format
    - userId: Facebook ID or email hash
    - timestamp: Model creation time
  - Prediction data: `{userId}.{timestamp}_{predictionId}` format
    - predictionId: Unique identifier for each generation
  - Magic links: Temporary tokens for email authentication
  - Sessions: User authentication state management
  - [TODO: Add complete schema documentation]

## API Endpoints

### Authentication
- `/api/facebook/auth`: Initiates Facebook OAuth flow
- `/api/facebook/callback`: Handles OAuth callback
- `/api/verify-token`: Validates JWT tokens

### Image Management
- `/api/zipper`: Creates ZIP files from uploaded images
- `/api/bytescale`: Handles image upload operations
- [TODO: Add rate limits and security measures]

### Model Operations
- `/api/model`: Creates and manages AI models
- `/api/genmodel`: Initiates model training
- `/create`: Handles image generation requests
- [TODO: Add model versioning details]

## Frontend Architecture
- Built with SvelteKit
- Key components:
  - FacebookAuth: Handles authentication flow
  - ModelDisplay: Renders model selection and results
  - [TODO: Add component hierarchy]

## Development Setup
[TODO: Add development environment setup instructions]

## Deployment
- Hosted on Cloudflare Pages
- [TODO: Add deployment workflow documentation]

## Security Considerations
[TODO: Add security measures and best practices]

## Performance Optimization
[TODO: Add caching strategies and optimization techniques]

## Monitoring and Logging
[TODO: Add monitoring setup and logging practices]
- Add pushover.net monitoring
  - Send updates for new user, new prediction, new model
  - Errors 

## Future Enhancements
- Use an llm to generate text descriptions of user's uploaded images
- 
- [TODO: Add planned features and improvements]

