'use strict';
import { checkPermissionListQuery} from "./common";

describe('Read all user permissions on all the domains', () => {
    test('it should be possible to get a comprehensive permission list for a particular user', async () => {
        await checkPermissionListQuery( {
            user: 'inventor1@emca'
        },
            `[
                {
                    domain: 'Comments',
                    permitted: 'DELETE_OWN,EDIT_OWN'
                },
                {
                    domain: 'Ideas',
                    permitted: 'CREATE,CREATE-COMMENT_OWN,DELETE_OWN,EDIT_OWN,READ-COMMENT_OWN,READ_OWN'
                }
            ]`
        )
    })
})

