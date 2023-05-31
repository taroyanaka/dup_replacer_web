-- sqlite3で全てのテーブルとそのデータを削除するクエリ
DROP TABLE IF EXISTS user_permission;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS dups_parent;
DROP TABLE IF EXISTS dups;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS dups_parent_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS comment_replies;


-- ja: データ制限量
-- en: Data limit

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
  commentable INTEGER NOT NULL,
  data_limit INTEGER NOT NULL,

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
  content_4 TEXT NOT NULL,
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

CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dups_parent_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
);

CREATE TABLE comment_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  reply TEXT NOT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (comment_id) REFERENCES comments(id)
);



-- user_permissionにレコード挿入する
INSERT INTO user_permission (id, permission,
readable,
writable,
deletable,
likable,
commentable,
data_limit,
created_at, updated_at) VALUES (1, 'guest', 1, 0, 0, 0, 0,
200,
DATETIME('now'), DATETIME('now'));
INSERT INTO user_permission (id, permission,
readable,
writable,
deletable,
likable,
commentable,
data_limit,
created_at, updated_at) VALUES (2, 'user', 1, 1, 1, 1, 1,
40000,
DATETIME('now'), DATETIME('now'));

INSERT INTO user_permission (id, permission,
readable,
writable,
deletable,
likable,
commentable,
data_limit,
created_at, updated_at) VALUES (3, 'pro', 1, 1, 1, 1, 1,
400000,
DATETIME('now'), DATETIME('now'));


-- usersにデータをレコード挿入する
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (1, 'GUEST', 'GUEST_PASS', DATETIME('now'), DATETIME('now'));
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'user1', 'user_pass1', DATETIME('now'), DATETIME('now'));
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'user2', 'user_pass2', DATETIME('now'), DATETIME('now'));
INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (3, 'pro1', 'pro_pass1', DATETIME('now'), DATETIME('now'));

