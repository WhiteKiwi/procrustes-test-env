CREATE KEYSPACE kiwi WITH replication = {'class': 'NetworkTopologyStrategy', 'datacenter1': '3'};

CREATE TABLE kiwi.user_sessions (
    uuid text PRIMARY KEY,
    access_token text,
    refresh_token text
) WITH default_time_to_live = 60;
