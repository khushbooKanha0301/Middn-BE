let AWS = require('aws-sdk')

export default () => ({
	port: parseInt(process.env.NEST_PORT, 10) || 4000,
	database_url: process.env.NEST_DATABASE_URL,
	aws_s3_bucket_name : process.env.NEST_AWS_BUCKT_KEY,
	jwt_secret : process.env.NEST_JWT_SECRET,
	main_url: process.env.NEST_MAIN_URL,
	s3: new AWS.S3({
		accessKeyId : process.env.NEST_AWS_S3_ACCESS_KEY_ID,
		secretAccessKey : process.env.NEST_AWS_S3_SECRET_ACCESS_KEY,
		signatureVersion: process.env.NEST_AWS_S3_SIGNATURE_VERSION,
	})
  });