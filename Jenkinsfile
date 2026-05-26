pipeline {
    agent any

    environment {
        GIT_CREDS  = 'Git-email'
        GIT_REPO   = 'https://github.com/Janakiraman0207/Test-Email-App.git'
        GIT_BRANCH = 'master'

        SSH_KEY     = 'deploy-ec2-key'
        DEPLOY_USER = 'ubuntu'
        DEPLOY_HOST = '172.31.41.212'
        APP_DIR     = '/home/ubuntu/Test-Email-App'
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: "${GIT_BRANCH}",
                    credentialsId: "${GIT_CREDS}",
                    url: "${GIT_REPO}"
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                if [ -d frontend ]; then
                    cd frontend
                    npm install
                    npm run build
                else
                    echo "Frontend directory not found"
                fi
                '''
            }
        }

        stage('Deploy Files') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    rsync -avz --delete \
                    --exclude='.git' \
                    --exclude='node_modules' \
                    --exclude='.ssh' \
                    frontend \
                    django_backend \
                    email_project \
                    fastapi_app \
                    manage.py \
                    requirements.txt \
                    ${DEPLOY_USER}@${DEPLOY_HOST}:${APP_DIR}
                    """
                }
            }
        }

        stage('Install Dependencies & Migrate') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        cd ${APP_DIR}

                        if [ ! -d venv ]; then
                            python3 -m venv venv
                        fi

                        source venv/bin/activate

                        pip install --upgrade pip

                        pip install -r requirements.txt

                        python manage.py migrate --noinput
                    '
                    """
                }
            }
        }

        stage('Build Frontend In Slave') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        cd ${APP_DIR}/frontend

                        npm install

                        npm run build

                        sudo cp -r dist/* /var/www/html/
                    '
                    """
                }
            }
        }

        stage('Restart Services') {
            steps {
                sshagent([env.SSH_KEY]) {
                    sh """
                    ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                        sudo systemctl restart fastapi
                        sudo systemctl restart nginx
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful'
        }

        failure {
            echo 'Deployment Failed'
        }
    }
}
