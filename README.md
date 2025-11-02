
# Finwise

## Problem
Managing personal finances can be overwhelming, especially for individuals who lack financial literacy or motivation. Many people struggle to track expenses, set savings goals, and stay informed about financial news, which can lead to poor financial decisions and missed opportunities. Finwise aims to make personal finance management engaging and accessible by combining gamification, analytics, and curated news updates.

## Plan
Finwise is a web application built with Next.js and Python. The frontend provides interactive forms for tracking income, expenses, loans, and rewards, along with gamified visualizations to motivate users. The backend integrates with external APIs (such as NewsAPI and translation services) to deliver relevant financial news and support multilingual content. User authentication and analytics tracking are included to personalize the experience and monitor progress.

## Run Steps
1. **Install dependencies:**
	```bash
	npm install
	# or
	yarn install
	```
2. **Start the development server:**
	```bash
	npm run dev
	# or
	yarn dev
	```
3. **Backend setup:**
	- Ensure Python 3.x is installed.
	- Install backend dependencies:
	  ```bash
	  pip install -r backend/requirements.txt
	  ```
	- Run backend services as needed (see backend/README.md for details).
4. **Access the app:**
	- Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Link
- [Live Demo](#) *(Add link if deployed)*
- [Video Demo](#) *(Add link if available)*

## Limitations
- Some features (e.g., advanced analytics, multi-language support) are in early stages and may require further refinement.
- API rate limits and connectivity issues may affect news and translation services.
- UI/UX can be improved for better accessibility and engagement.
- Future work includes expanding gamification, adding budgeting tools, and deploying a stable live version.
