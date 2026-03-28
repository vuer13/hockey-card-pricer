# Hockey Card Pricer

## Objective
This application aims to reduce the time needed to determine the price of hockey cards by 70% using a computer vision pipeline and eBay API calls.

## Project Workflow
1. Sign up or log in with your email
2. Take a photo of a hockey card
3. Use computer vision to detect and extract key card details
4. Save the card to your account
5. Retrieve the current estimated price of the card
6. Track price changes over time each time a new estimate is requested

## How It Works
The user uploads or captures an image of a hockey card through the app. The backend processes the image using a custom computer vision pipeline to identify important card features. After the card is identified and confirmed, the application stores it in the database under the user’s account. The system then uses external pricing data, such as eBay sold listings, to estimate the current market value of the card. Each pricing request can also be stored to help track how the card’s value changes over time.

## Features
- FastAPI backend
- Expo React Native frontend
- Supabase authentication and Postgres database integration
- Custom Faster R-CNN computer vision pipeline for extracting hockey card features
- Card image upload and storage
- Current price estimation using market data
- Saved cards linked to user accounts
- Historical price tracking over time

## Pre-requesites
- Python 3.10+ (https://www.python.org/downloads/)

## Model-training

This project utilized a computer vision pipeline. 

- YOLO for card detection: `/backend/yolo`
    - Sample outputs are shown in folder
- FasterRCNN for card segmentation of different components (ie. name, card number, team, card series)
    - See https://github.com/vuer13/FasterRCNN-HockeyCardSegmentation.git for more information
- OCR for text extraction

## Setup (backend)
### 1. Create and activate a virtual environment

A **virtual environment** is an isolated Python environment that keeps project dependencies separate from other projects. This prevents conflicts between different projects that might need different versions of the same library.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # macOS / Linux
# On Windows (PowerShell): .venv\Scripts\Activate.ps1
# On Windows (Command Prompt): .venv\Scripts\activate.bat
```

If the above doesn't work, try:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # macOS / Linux
# On Windows (PowerShell): .venv\Scripts\Activate.ps1
# On Windows (Command Prompt): .venv\Scripts\activate.bat
```

**How to know it's working**: Your terminal prompt should show `(.venv)` at the beginning.

**To deactivate** (when you're done working): Type `deactivate`

### 2. Install dependencies

```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

This installs all the Python packages needed for the project. This may take a few minutes.

If the above doesn't work, try
```bash
cd backend
pip3 install --upgrade pip
pip3 install -r requirements.txt
```

### 3. Run the FastAPI backend (dev)

```bash
cd backend
uvicorn backend.app.main:app --reload
```

## Setup (frontend)
### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Start the developmental server

```bash
npx expo start --clear
```

This starts the Expo development server and clears the cache to help avoid stale build issues.

### 3. Open the app on your device

Once the server starts, a QR code will appear in the terminal or browser. Download the **Expo Go** app from the App Store or Google Play, then scan the QR code to open the development version of the app on your phone.

## Repository Layout
```text
Hockey-Card-Price-Matcher/
├── .github/                    # GitHub configuration files
│   └── workflows/
│       ├── backend-ci.yml      # CI workflow for backend linting and tests
│       └── frontend-ci.yml     # CI workflow for frontend linting
├── backend/                    # FastAPI backend application
│   ├── app/                    # Core backend application code
│   │   ├── main.py             # FastAPI application entry point
│   │   └── scripts/            # Backend helper scripts and utilities
│   │   └── db/                 # Database models, sessions, and database logic
│   │   └── auth/               # Supabase authentication logic
│   │   └── utils/              # Utility functions such as AWS S3 helpers
│   ├── tests/                  # Backend test suite
│   └── yolo/                   # YOLO training and card detection code
│   └── Dockerfile              # Dockerfile 
│   └── .dockerignore           # Files for docker to ignore
│   └── pyproject.toml          # Settings for linting
├── frontend/                   # React Native + Expo frontend application
│   ├── app/                    # Expo Router app directory
│   │   ├── (auth)/             # Authentication-related screens
│   │   ├── (tabs)/             # Main tab-based navigation screens
│   │   └── camera/             # Camera-related screens and flows
│   │   └── camera/             # Card-related screens for individual cards
│   ├── auth/                   # Frontend authentication helpers and logic
│   ├── components/             # Reusable UI components
│   ├── .gitignore              # Frontend-specific ignored files
│   └── package.json            # Frontend dependencies and scripts
├── .gitignore                  # Root ignored files for the repository
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # Project documentation
```

### Key Files
- `backend/app/main.py` – FastAPI entrypoint and router wiring.

## Database Schema 
NOTE: This schema will be normalized in the near feature

The backend uses three main tables: `card_info`, `card_image`, and `card_price`.

### `card_info`
Stores the main metadata for each hockey card associated with a user.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key for the card |
| `user_id` | UUID | ID of the user who owns the card |
| `name` | String | Name of the player or card |
| `card_series` | String | Series or set the card belongs to |
| `card_number` | String | Card number within the series |
| `card_type` | String | Type of card, defaults to `Base` |
| `team_name` | String | Team associated with the card |
| `created_at` | DateTime | Timestamp for when the card was created |
| `saved` | Boolean | Indicates whether the card has been saved by the user |

### `card_image`
Stores image records linked to a specific hockey card.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key for the image record |
| `card_id` | UUID | Foreign key referencing `card_info.id` |
| `image_type` | String | Type of image, such as `front` or `back` |
| `s3_key` | String | AWS S3 key for the stored image |
| `created_at` | DateTime | Timestamp for when the image record was created |

### `card_price`
Stores pricing history and estimate information for each hockey card.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key for the price record |
| `card_id` | UUID | Foreign key referencing `card_info.id` |
| `estimate` | Float | Estimated current price of the card |
| `low` | Float | Lower bound of the estimated price range |
| `high` | Float | Upper bound of the estimated price range |
| `num_sales` | Integer | Number of sales used to generate the estimate |
| `confidence` | Float | Confidence score for the estimate |
| `created_at` | DateTime | Timestamp for when the price record was created |

## Troubleshooting

### Virtual Environment Issues
- **Problem**: `python3 -m venv .venv` fails
- **Solution**: Make sure Python 3.10+ is installed. Check with `python3 --version` or `python --version`

### Package Installation Issues
- **Problem**: `pip install` fails for specific packages
- **Solution**: Make sure you're in the virtual environment (see `(.venv)` in prompt). Try `pip install --upgrade pip` first.

### Import Errors
- **Problem**: `ImportError` when running code
- **Solution**: Make sure that your virtual environment is activated in terminal.

## Future Considerations
- Implementing a faster computer vision model to speed processing times
- Using a better card pricing API (COMC, etc.)
- Normalizing the database to reduce redundancy
- Using Agentic AI to determine the value of the card
- Refactoring the backend for code cleanliness
- STRETCH: grade cards to get a more accurate representation

## Author
Built as a full-stack project focused on combining software engineering, computer vision, and market data analysis to improve the hockey card pricing workflow.