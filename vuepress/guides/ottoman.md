# Ottoman Class

## Defining an Ottoman's instance:
```typescript
import { Ottoman } from "./ottoman";

const ottoman = new Ottoman();
```

Ottoman's instances are the backbone of Ottoman.js. They are the entry point to use the ODM in your app.

## Ottoman constructor options

Ottoman allows you to modify some settings, which could be useful for database modeling or migration,
you can for example change the metadata key to define the model in documents.

```typescript
import { Ottoman } from "./ottoman";

const ottoman = new Ottoman({
    modelKey: 'type',
});
```

The `modelKey` default value is set to `_type`, but maybe you want to change it to `type` as it's described in the example above.

The available configurations are:

```typescript
interface OttomanConfig {
  collectionName?: string;
  scopeName?: string;
  modelKey?: string;
  populateMaxDeep?: number;
  searchConsistency?: SearchConsistency;
  maxExpiry?: number;
  keyGenerator?: (params: { metadata: ModelMetadata}) => string;
}
```

- `collectionName`: store value to use for each Model if it doesn't provide any. The default value will be the Model's name.
- `scopeName`: store value to use for each Model if it doesn't provide any. The default value is `_default`
- `modelKey`: define the key to store the model name into the document. The default value is `_type`
- `populateMaxDeep`: set default value for population. Default value is `1`.
- `searchConsistency`: define default Search Consistency Strategy. The default value is `SearchConsistency.NONE`
- `maxExpiry`: value used to create a collection for this instance. The default value is `300000`.
- `keyGenerator`: function to generate the key to store documents.

The default implementation for `keyGenerator` function is:
```typescript
KEY_GENERATOR = ({ metadata }) => `${metadata.modelName}`;
```
`keyGenerator` can be overridden for each `Model` if you want, check this in [model options](/guides/model.html#model-options)

# Connections

All your [Models](/guides/model) will be created via a connection and map to a Collection.

## Create a connection

You can connect to Couchbase Server with the [connect()](/classes/ottoman.html#connect) method.

```javascript
import { Ottoman } from 'ottoman';

const ottoman = new Ottoman();
ottoman.connect('couchbase://localhost/travel-sample@admin:password');
```

This is the minimum needed to connect to the travel-sample bucket.
If the connection fails on your machine, try using 127.0.0.1 instead of `localhost`.

### Connection String Anatomy

![Connection Anatomy](./connection-anatomy.png)


## Connection options
`connect` function also support a javascript object as parameter.
```javascript
import { Ottoman } from 'ottoman';

const ottoman = new Ottoman();
ottoman.connect({
    connectionString: 'couchbase://localhost',
    bucketName: 'travel-sample',
    username: 'admin',
    password: 'password'
});
```

The available connections options are:

```typescript
interface ConnectOptions {
  connectionString: string;
  username: string;
  password: string;
  bucketName: string;
  authenticator?: CertificateAuthenticator;
  trustStorePath?: string;
  transcoder?: unknown;
  logFunc?: unknown;
}
```

## Using the default ottoman instance functions

```javascript
import { connect, model } from 'ottoman';
// connecting to server
connect('couchbase://localhost/travel-sample@admin:password');

// Now you can use the model function to create Models in the default connection.
const User = model('User', { name: String });
```

::: tip
Notice we start using Ottoman without creating any instance, it's possible by using the `connect` function.
`connect` function will create a default ottoman instance with default options if there's not an ottoman default instance created yet.
:::


IMPORTANT: This will be the recommended way to use `Ottoman` if your app uses only 1 instance.
This way ottoman will save for you the Ottoman instance to work in any place of your code.

Example `model` instead of `ottoman.model`.
Also there are `start`, `close`, `connect`, `getDefaultInstance`' functions are available for Ottoman default instance.

## Certificate Authentication

Couchbase Server supports the use of X.509 certificates to authenticate clients
(only available in the Enterprise Edition, not the Community Edition).
This allows authenticated users to access specific resources by means of the data service,
in Couchbase Server 5.1 and up, and all other services in more recent releases of Couchbase Data Platform.

The process relies on a certificate authority, for the issuing of certificates that validate identities.
A certificate includes information such as the name of the entity it identifies,
an expiration date, the name of the authority that issued the certificate, 
and the digital signature of the authority.
A client attempting to access Couchbase Server can present a certificate to the server,
allowing the server to check the validity of the certificate.
If the certificate is valid, the user under whose identity the client is running, and the roles assigned that user,
are verified. If the assigned roles are appropriate for the level of access requested to the specified resource,
access is granted.

For a more detailed conceptual description of using certificates, see [Certificates](https://docs.couchbase.com/server/6.5/learn/security/certificates.html1).

### Authenticating Ottoman by Certificate

For sample procedures whereby certificates can be generated and deployed,
see [Manage Certificates](https://docs.couchbase.com/server/6.5/manage/manage-security/manage-certificates.html).
The rest of this document assumes that the processes there,
or something similar, have been followed. That is, 
a cluster certificate has been created and installed on the server,
a client certificate has been created, and it is stored in a JVM keystore along with the cluster’s certificate.

```typescript
import { Ottoman, CertificateAuthenticator } from 'ottoman';
const ottoman = new Ottoman();

ottoman.connect({
  connectionString: 'couchbase://localhost',
  bucketName: 'travel-sample',
  authenticator: new CertificateAuthenticator(
          "/path/to/client/certificate.pem",
          "/path/to/client/key.pem"
  ),
  trustStorePath: "/path/to/ca/certificates.pem",
})
```


## Multiple ottoman instances

```javascript
import { Ottoman } from 'ottoman';
const ottoman1 = new Ottoman();
ottoman1.connect('couchbase://localhost/travel-sample@admin:password');

const ottoman2 = new Ottoman();
ottoman2.connect('couchbase://localhost/other-bucket@admin:password');

// After connect you can create an explicitly Model from a given connection

//Creating UserModel from ottoman1
const UserModel = ottoman1.model('User', { name: String });

//Creating CatModel from ottoman2
const CatModel = ottoman2.model('Cat', { age: Number });
```

## Default ottoman instance

```javascript
import { Ottoman, getDefaultInstance } from 'ottoman';
const ottoman1 = new Ottoman();
const ottoman2 = new Ottoman();

// Getting default connection
const defaultConnection = getDefaultConnection();
// defaultConnection = ottoman1;
```

The first ottoman instance created will be set as the default instance and
could be accessed anywhere in your code by calling `getDefaultInstance` function.

## Closing connections

```javascript
import { Ottoman, getDefaultInstance } from 'ottoman';
const ottoman1 = new Ottoman();
ottoman1.connect('couchbase://localhost/travel-sample@admin:password');

// Closing connection1
ottoman1.close();

// Or just call the `close` function to close the default ottoman instance connection. In this case, the `ottoman1` connection will be closed.
close();
```

::: tip
Always remember to close your connections.
:::

## Not using scopes/collections

If you don't want to use the scopes/collection approach set the ottoman instances this way:

```typescript
import { Ottoman } from "./ottoman";

const ottoman = new Ottoman({collectionName: '_default'});
```

This way Ottoman will store all your data in a bucket.

## Bootstrapping

Ottoman class will provide 3 main methods in order to bootstrap the app:
- `ensureCollections` will attempt to create collections and scopes for each model.
- `ensureIndexes` will attempt to create all indexes defined in the schema definition.
- `start` method is just a shortcut to run `ensureCollections` and `ensureIndexes`.
  Notice: It's not required to execute the `start` method to Ottoman work.
  
## Helper functions

Ottoman provides some helpers functions:
- [dropBucket](/classes/ottoman.html#dropbucket) drops a bucket from the cluster.
- [dropScope](/classes/ottoman.html#dropscope) drops a scope from a bucket.
- [dropCollection](/classes/ottoman.html#dropcollection) drops a collection from a scope in a bucket.

## Next Up

Great job! Now we're connected, let's take a look at [Schemas](/guides/schema).
