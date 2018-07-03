def getRepo(){
            String name = "${env.JOB_NAME}";
            String[] value = name.split('/');
            return value[0];
}

def gitCredentials = "JenkinsGithub"


pipeline {
  agent any
  stages {

        stage('Publish NPM') {
            when {
                branch 'master'
            }
          steps {

              withCredentials([string(credentialsId: 'npm-token', variable: 'NPM_TOKEN')]) {
                              sshagent(credentials: ["${gitCredentials}"]){
                                sh '''
                                      npm version patch
                                      git add .
                                      git commit -m "Jenkins version bump" | true
                                      git push origin cleanup-and-styling
                                      git push origin --tags
                                      echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
                                      npm publish
                                '''
                                }

              }

          }
        }
        stage('Update Servicebot repo'){
          when {
              branch 'master'
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
