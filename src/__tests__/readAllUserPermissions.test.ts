'use strict';
import { checkPermissionListQuery} from "./common";

describe('Read all user permissions on all the domains', () => {
    test('it should be possible to get a comprehensive permission list for a particular user', async () => {
        await checkPermissionListQuery( {
            user: 'inventor1@emca'
        },
            `[
                {
                    resource: 'Comment',
                    permitted: 'DELETE_OWN,EDIT_OWN'
                },
                {
                    resource: 'User_Idea',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                }
            ]`
        )
    })
})

