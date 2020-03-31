pipeline{
    agent any
    options {
        timeout(time: 20, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '3', daysToKeepStr: '5'))
    }
    environmentExample {
        SCANNER = tool name: 'SonarScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
        REPO = 'Vaccination-Ministry'
        KEY = 'Vaccination-Ministry'
        NAME = 'Vaccination-Ministry'
        NODE_PATH = '/usr/lib/node_modules'
    }
    stages{
        stage("Prepare"){
            steps{
                cleanWs()
                checkout scm
                script {
                    env.PARENT = ''
                }
            }
        }
        stage("Set parent branch") {
            parallel {
                stage("For test branch") {
                    when {
                        expression { BRANCH_NAME ==~ /(test)/ }
                    }
                    steps {
                        script {
                            env.PARENT = '-Dsonar.branch.target=master'
                        }
                    }
                }
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
                                -Dsonar.branch.name=${BRANCH_NAME} \
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
                                    -Dsonar.github.pullRequest=${CHANGE_ID} \
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
