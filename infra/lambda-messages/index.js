const aws = require('aws-sdk');

const env = process.env.ENV;
const TableName = `plebio-wss-messages_${env}`;

const dynamo = new aws.DynamoDB.DocumentClient();

exports.handler = async e => {
  const result = await dynamo.query({
    TableName,
    Limit: 50, // TODO: set as env var
    ScanIndexForward: false,
    KeyConditionExpression: 'id = :id',
    ExpressionAttributeValues: {
      ':id': 'message', // this should also be an env var
    }
  }).promise();
  console.log('res', result);
  return {statusCode:200, body: JSON.stringify(result.Items.map(i => ({name:i.name,message:i.message})))};
};
