pipeline {
    agent { docker { image 'node:6.3' } }
    environment {
      ADDED_ENV_VAR = 'added env variable for all steps within pipeline'

      // Dynamic set of env variables:
      RETURN_EXIT_STATUS = """${sh(
            returnStatus: true,
            script: 'exit 1'
        )}"""
      RETURN_STD_OUT_EXAMPLE = """${sh(
            returnStdout: true,
            script: 'echo "clang"'
        )}"""
    }

    // Parameters for pipeline. See usage in stage 2 step 1 
    parameters {
      string(name: 'userName', defaultValue: 'Alex-Default', description: 'Default user name to usage')
    }

    stages {
        stage('Example Stage 1') {
            environment {
              ADDED_ENV_VAR_FOR_STAGE = 'added env variable for stage where it was declared'
            }
            steps {
                sh 'npm --version'
                echo "Running ${env.BUILD_ID} on ${env.JENKINS_URL}"
                echo env.ADDED_ENV_VAR
                echo env.ADDED_ENV_VAR_FOR_STAGE
                sh 'printenv'
            }
        }
        stage('Example Stage 2') {
            steps {
                // via "params" it is possible to acces define "parameters", and parameters from "Build with Paraemters" setting
                echo "${params.userName} is current user"
            }
        }
    }
}