def getRepo(){
            String name = "${env.JOB_NAME}";
            String[] value = name.split('/');
            return value[0];
}

def gitCredentials = "5f030cd1-e0e4-4f75-8522-38baf2111155"


pipeline {
  agent any
  stages {

        stage('Publish NPM') {
            when {
                branch 'cleanup-and-styling'
            }
          steps {

              withCredentials([string(credentialsId: 'npm-token', variable: 'NPM_TOKEN')]) {

                              sh '''
                                    echo NPM_TOKEN
                                    echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
                                    npm whoami
                                    npm install
                                    npm run-script build
                                    npm version patch
                                    npm publish
                                    git add .
                                    git commit -m "Jenkins version bump"
                                    git push cleanup-and-styling
                                    git push --tags
                                '''

              }

          }
        }
        stage('Update Servicebot repo'){
          when {
              branch 'cleanup-and-styling'
          }
          steps{
            dir('servicebot'){
                  git(url: "git@github.com:service-bot/servicebot.git", branch: 'tiers', credentialsId: "${gitCredentials}")

                sshagent(credentials: ["${gitCredentials}"]){
                 sh '''
                    npm update ${getRepo()}
                    git add .
                    git commit -m "Jenkins version bump"
                    git push origin tiers
                    '''
              }
            }
        }
    }


        stage('Upload To S3') {
          when {
              branch 'cleanup-and-styling'
          }
          steps {
            withAWS(credentials: 'aws', region: 'us-east-1') {
              s3Upload(bucket: 'servicebot.io', acl: 'PublicRead', workingDir: 'public/build/', path:'js/', includePathPattern: '**/*')
              cfInvalidate(distribution: 'E9S44VPPPCDMC', paths: ['/*'])
            }

          }

    }
  }
}
