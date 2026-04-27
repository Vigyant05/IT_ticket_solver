git clone https://github.com/n8n-io/self-hosted-ai-starter-kit.git
cd self-hosted-ai-starter-kit
cp .env.example .env
make sure docker is running actively
docker-compose up -d
head over to your browser and go to: http://localhost:5678

Open a new terminal tab (keep your current one open or just stay in the same folder).

Run this command to download a lightweight but powerful AI model:
docker exec -it ollama ollama run llama3

Once the download finishes, you can type a quick "hello" to test it, 
then type /exit to get back to your terminal.

now import the json file in the n8n opened in the local host
