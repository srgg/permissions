## Multi-tenancy
The key concept of multi-tenancy is **organization**. User belongs to one organization has no access to any resource that belongs to another organization.

Therefore users, roles, as well as other important resources are bound to the corespondent organization. 

As a result each organization can manage it's resources separately.

**NOTE:** Pre-created organization with a hardcoded id `1` can be used to create resources shared across all the organizations.
In that manner it is easy to create  built-in roles.

## Permissions
*Permission* is a statement that defines an explicit action *'what'* the application can do and nothing more.
It is the lowest-level constructs in security polices.

Defining *'who'* (users) is allowed to do *'what'* (permissions) is an exercise of assigning permissions to users.

Permission consists from 3 parts:
 - the first part is the **domain** that is being operated on;
 - the second part is the **action** (query) being performed;
 - the third part is the **instance(s)** being acted upon.

Permission from the example below allows to *print* and *query* (actions) on *lp7200* (particular instance) *printer* (domain):
```
printer:print,query:lp7200
```
The colon `:` is a special character used to delimit the next part in the permission string.
The second part(action) can contain multiple values, delimited with coma `,`.

There is another special character that can be used -- **wildcard symbol** `*`. 
It can be used in the domain and instance parts. 
And it means *'all the domains'*' and *'all the instances'* accordingly.

Example below shows permission that allows to print on any printer:
```
printer:print:*
```


## The concept of an ownership handled at the action level
Actions that are ends with `_own` suffix are treated as a permission granted to all own instances on entire domain.

Permission from the example below, allows to read any budget within organization but limits budget modification to owners only:
```
budget:read,edit_own:*
```

**Note:** from the firts time it can be tricky to use instance part in conjunction with a `_own` permissions, but the rule is quite simple: 
**if actual instance listed in the permission is not owned by the user, none of the '_own' actions are not allowed.**

## How to run test
```
npm test
npm run e2e
```
