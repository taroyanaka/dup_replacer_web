-- sqlite3で全てのテーブルとそのデータを削除するクエリ
DROP TABLE IF EXISTS user_permission;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS dups_parent;
DROP TABLE IF EXISTS dups;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS dups_parent_tags;
DROP TABLE IF EXISTS tags;

-- ユーザーの権限のテーブル。カラムはIDはと名前と作成日と更新日を持つ。IDは自動的に増加する
-- カラムの中には、一般ユーザー、ゲストユーザーがある
-- ゲストユーザーはreadだけできる。一般ユーザーはread,write,deleteができる
CREATE TABLE user_permission (
  id INTEGER PRIMARY KEY,

  permission TEXT NOT NULL,
  readable INTEGER NOT NULL,
  writable INTEGER NOT NULL,
  deletable INTEGER NOT NULL, 
  likable INTEGER NOT NULL,

  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- ユーザーのテーブル。カラムはIDはと名前とパスワードと作成日と更新日を持つ。IDは自動的に増加する
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_permission_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  userpassword TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_permission_id) REFERENCES user_permission(id)
);

-- dups_parentというテーブル1つに対して1つ以上のdupsテーブルを持つ
CREATE TABLE dups_parent (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);


-- dupというブログのようなサービスのテーブル。contentと作成日と更新日を持つ。IDは自動的に増加する。usersのIDを外部キーとして持つ
CREATE TABLE dups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dups_parent_id INTEGER NOT NULL,
  content_group_id INTEGER NOT NULL,
  content_1 TEXT NOT NULL,
  content_2 TEXT NOT NULL,
  content_3 TEXT NOT NULL,
  FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
);

-- likesというブログの高評価ボタンのようなサービスのテーブル。IDは自動的に増加する。dups_parentのIDを外部キーとして持つ
CREATE TABLE likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dups_parent_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
);

-- dups_parentとtagsの中間テーブル
CREATE TABLE dups_parent_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dups_parent_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- tagsというブログのタグのようなサービスのテーブル。IDは自動的に増加する。dups_parent_tagsを外部キーとして持つ
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tag TEXT NOT NULL
);




-- user_permissionにデータを2レコード挿入する
INSERT INTO user_permission (id, permission,
readable,
writable,
deletable,
likable,
created_at, updated_at) VALUES (1, 'guest', 1, 0, 0, 0, DATETIME('now'), DATETIME('now'));
INSERT INTO user_permission (id, permission,
readable,
writable,
deletable,
likable,
created_at, updated_at) VALUES (2, 'user', 1, 1, 1, 1, DATETIME('now'), DATETIME('now'));


-- usersにデータを3レコード挿入する
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (1, 'GUEST', 'GUEST_PASS', DATETIME('now'), DATETIME('now'));
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'name1', 'password1', DATETIME('now'), DATETIME('now'));
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'name2', 'password2', DATETIME('now'), DATETIME('now'));

-- likesにデータを3レコード挿入する
-- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 1, DATETIME('now'), DATETIME('now'));
-- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 2, DATETIME('now'), DATETIME('now'));
-- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 3, DATETIME('now'), DATETIME('now'));

SELECT
dups_parent.id AS dups_parent_id
,dups.content_1 AS dups_content_1
-- tagがない場合は空文字を返し、ある場合はカンマ区切りで返す
-- ,IFNULL(GROUP_CONCAT(tags.tag, ', '), NULL) as res
,(SELECT
    IFNULL(GROUP_CONCAT(tags.tag, ', '), 'NO_TAG') as RESULT
    FROM dups_parent
    LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
    LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
    WHERE dups_parent.id = 8)
      AS FOO
FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
-- LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
-- LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
WHERE users.username = 'name1';



SELECT
dups_parent.id AS dups_parent_id
,dups.content_1 AS dups_content_1
-- tagがない場合は空文字を返し、ある場合はカンマ区切りで返す
-- ,IFNULL(GROUP_CONCAT(tags.tag, ', '), "ZZZZZZZ") as tags
-- ,GROUP_CONCAT(tags.tag, ', ') as tags
,tags.tag AS tags_tag
FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
WHERE users.username = 'name1';


SELECT
IFNULL(GROUP_CONCAT(tags.tag, ', '), "ZZZZZZZ") as tags
FROM dups_parent
LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
WHERE dups_parent.id = 9;


SELECT
dups_parent_tags.id AS dups_parent_tags_id
,dups_parent_tags.dups_parent_id AS dups_parent_tags_dups_parent_id
,dups_parent_tags.tag_id AS dups_parent_tags_tag_id
,tags.id AS tags_id
,tags.tag AS tags_tag
FROM dups_parent
LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
WHERE dups_parent.id = 9;












SELECT
dups_parent.id AS FOO
,dups.content_1 AS dups_content_1
,(SELECT
dups_parent.id AS THE_ID
FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
WHERE users.username = 'name1')
FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
WHERE users.username = 'name1';







(SELECT
dups_parent.id AS THE_ID
FROM dups_parent LEFT JOIN users ON dups_parent.user_id = users.id
LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
WHERE users.username = 'name1')