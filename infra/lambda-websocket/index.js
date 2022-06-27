const aws = require('aws-sdk');
// this patch.js and init fn shouldnt be required any longer, but its still working so idgaf atm.
// TODO: check if AWS fixed this someday(2022-06-25 rn)
require('./patch.js');

const env = process.env.ENV;
const ConnectionTableName = `plebio-wss-connections_${env}`;
const MessageTableName = `plebio-wss-messages_${env}`;

aws.config.update({ region: process.env.REGION });

const dynamo = new aws.DynamoDB.DocumentClient();

let send;
function init(event) {
  const apigwManagementApi = new aws.ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint: event.requestContext.domainName + '/' + event.requestContext.stage,
  });
  send = async (connectionId, data) => {
    await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: JSON.stringify(data) }).promise();
  };
}
const truncateString = (val, length) => {
  if (!val || !val?.length) return val;
  return val.substr(0, length);
};

exports.handler = async e => {
  if (!e || !e.requestContext || !e.requestContext.routeKey) { return {statusCode:400}; }
  switch (e.requestContext.routeKey) {
    case '$connect': {
      await dynamo.put({
        TableName: ConnectionTableName,
        Item: {
          connectionId: e.requestContext.connectionId,
        },
      }).promise();
      return {statusCode:200};
    } break;
    case '$disconnect': {
      await dynamo.delete({
        TableName: ConnectionTableName,
        Key: {connectionId:e.requestContext.connectionId},
      }).promise();
      return {statusCode:200};
    }
    case 'onMessage': {
      init(e);
      const connectionId = e.requestContext.connectionId;
      const reqBody = JSON.parse(e.body);
      if (!reqBody.message?.length || !reqBody.name?.length) {
        console.error('name or message invalid', reqBody);
        return {statusCode:400};
      }
      const data = await dynamo.scan({TableName:ConnectionTableName}).promise();
      for (let i = 0; i < data.Items.length; i++) {
        if (data.Items[i].connectionId !== connectionId) {
          await send(data.Items[i].connectionId, {type:'message',message:reqBody.message,name:reqBody.name});
        }
      }
      await send(connectionId, {type:'end',status:'complete'});
      // save message. we should fire and forget here btw
      await dynamo.put({
        TableName: MessageTableName,
        Item: {
          id: 'message', // TODO: make env var
          // current date in seconds since epoch plus... 3 days worth in seconds?
          // should be an env var of course
          sort: Math.floor(new Date().getTime() / 1000) + (60 * 60 * 24 * 3),
          name: truncateString(reqBody.name, 50),
          message:truncateString(reqBody.message, 500),
        }
      }).promise();
      return {};
    } break;
    default: {
      // turning this into a keep-alive
      await send(e.requestContext.connectionId, {type:'ping',status:'connected'});
      return {statusCode:200};
    } break;
  }
}
