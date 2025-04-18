{
    "Role": {
        "Path": "/",
        "RoleName": "ai-chat-app-task-role",
        "RoleId": "AROASVLKCOKK3NO4TSI7X",
        "Arn": "arn:aws:iam::183295439509:role/ai-chat-app-task-role",
        "CreateDate": "2025-04-03T09:00:53+00:00",
        "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
    }
}
