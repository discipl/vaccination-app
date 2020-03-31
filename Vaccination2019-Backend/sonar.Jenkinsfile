pipeline{
    agent any
    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '3', daysToKeepStr: '5'))
    }
    environmentExample {
        SCANNER = tool name: 'SonarScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
        REPO = 'Vaccination-Backend'
        NAME = 'Vaccination-Backend'
        KEY = 'vaccination-backend'
    }
    stages{
        stage("Prepare"){
            steps{
                cleanWs()
                checkout scm
                script {
                    env.SHORT = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
                    env.BRANCH = sh(returnStdout: true, script: "echo ${GIT_BRANCH} | sed \"s|origin/||\"").trim()
                    env.PARENT = ''
                }
            }
        }
        stage("Set parent branch") {
            parallel {
                stage("For develop branch") {
                    when {
                            expression { BRANCH_NAME ==~ /(develop)/ }
                    }
                    steps {
                        script {
                            env.PARENT = '-Dsonar.branch.target=test'
                        }
                    }
                }
                stage("For preprod branch") {
                    when {
                            expression { BRANCH_NAME ==~ /(test)/ }
                    }
                    steps {
                        script {
                            env.PARENT = '-Dsonar.branch.target=master'
                        }
                    }
                }
                stage("For short branch") {
                    when {
                        not {
                            expression { BRANCH_NAME ==~ /(master|test|develop|PR-\d+)/ }
                        }
                    }
                    steps {
                        script {
                            env.PARENT = '-Dsonar.branch.target=develop'
                        }
                    }
                }
            }
        }
        stage("Get PR ID") {
            when {
                expression { BRANCH_NAME ==~ /(PR-\d+)/ }
            }
            steps {
                script {
                    env.PRID = sh(returnStdout: true, script: "echo \"${BRANCH}\" | grep -o '[0-9]*'").trim()
                    echo "${PRID}"
                }
            }
        }
        stage("SonarQube") {
            parallel {
                stage("SonarQube: branch check"){
                    when {
                        not {
                            expression { BRANCH_NAME ==~ /(PR-\d+)/ }
                        }
                    }
                    steps{
                        withSonarQubeEnv('sonar') {
                            sh '''
                                ${SCANNER}/bin/sonar-scanner \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_AUTH_TOKEN} \
                                -Dsonar.projectKey=${KEY} \
                                -Dsonar.projectName=${NAME} \
                                -Dsonar.projectVersion=1.0.0 \
                                -Dsonar.sources=. \
                                -Dsonar.branch.name=${BRANCH} \
                                ${PARENT}
                            '''
                        }
                    }
                }
                stage("SonarQube: PR check"){
                    when {
                        expression { BRANCH_NAME ==~ /(PR-\d+)/ }
                    }
                    steps{
                        withSonarQubeEnv('sonar') {
                            withCredentials([string(credentialsId: 'sonar-github-token', variable: 'TOKEN')]) {
                                sh '''
                                    ${SCANNER}/bin/sonar-scanner \
                                    -Dsonar.host.url=${SONAR_HOST_URL} \
                                    -Dsonar.login=${SONAR_AUTH_TOKEN} \
                                    -Dsonar.projectKey=${KEY} \
                                    -Dsonar.projectName=${NAME} \
                                    -Dsonar.projectVersion=1.0.0 \
                                    -Dsonar.sources=. \
                                    -Dsonar.github.pullRequest=${PRID} \
                                    -Dsonar.github.repository=LedgerLeopard/${REPO} \
                                    -Dsonar.github.oauth=${TOKEN} \
                                    -Dsonar.analysis.mode=preview
                                '''
                            }
                        }
                    }
                }
            }
        }
        stage("Check status") {
            when {
                not {
                    expression { BRANCH_NAME ==~ /(PR-\d+)/ }
                }
            }
            steps {
                waitForQualityGate abortPipeline: true
            }
        }
    }
}
