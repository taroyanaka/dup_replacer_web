// -- sqlite3で全てのテーブルとそのデータを削除するクエリ
// DROP TABLE IF EXISTS user_permission;
// DROP TABLE IF EXISTS users;
// DROP TABLE IF EXISTS dups_parent;
// DROP TABLE IF EXISTS dups;
// DROP TABLE IF EXISTS likes;
// DROP TABLE IF EXISTS dups_parent_tags;
// DROP TABLE IF EXISTS tags;

// -- ユーザーの権限のテーブル。カラムはIDはと名前と作成日と更新日を持つ。IDは自動的に増加する
// -- カラムの中には、一般ユーザー、ゲストユーザーがある
// -- ゲストユーザーはreadだけできる。一般ユーザーはread,write,deleteができる
// CREATE TABLE user_permission (
//   id INTEGER PRIMARY KEY,

//   permission TEXT NOT NULL,
//   readable INTEGER NOT NULL,
//   writable INTEGER NOT NULL,
//   deletable INTEGER NOT NULL, 
//   likable INTEGER NOT NULL,

//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL
// );

// -- ユーザーのテーブル。カラムはIDはと名前とパスワードと作成日と更新日を持つ。IDは自動的に増加する
// CREATE TABLE users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_permission_id INTEGER NOT NULL,
//   username TEXT NOT NULL,
//   userpassword TEXT NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (user_permission_id) REFERENCES user_permission(id)
// );

// -- dups_parentというテーブル1つに対して1つ以上のdupsテーブルを持つ
// CREATE TABLE dups_parent (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   user_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (user_id) REFERENCES users(id)
// );


// -- dupというブログのようなサービスのテーブル。contentと作成日と更新日を持つ。IDは自動的に増加する。usersのIDを外部キーとして持つ
// CREATE TABLE dups (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   content_group_id INTEGER NOT NULL,
//   content_1 TEXT NOT NULL,
//   content_2 TEXT NOT NULL,
//   content_3 TEXT NOT NULL,
//   FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );

// -- likesというブログの高評価ボタンのようなサービスのテーブル。IDは自動的に増加する。dups_parentのIDを外部キーとして持つ
// CREATE TABLE likes (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   user_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL,
//   FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );

// -- dups_parentとtagsの中間テーブル
// CREATE TABLE dups_parent_tags (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   dups_parent_id INTEGER NOT NULL,
//   tag_id INTEGER NOT NULL,
//   created_at DATETIME NOT NULL,
//   updated_at DATETIME NOT NULL
// );

// -- tagsというブログのタグのようなサービスのテーブル。IDは自動的に増加する。dups_parent_tagsを外部キーとして持つ
// CREATE TABLE tags (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     tag TEXT NOT NULL
// );

// CREATE TABLE comments (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     dups_parent_id INTEGER NOT NULL,
//     user_id INTEGER NOT NULL,
//     comment TEXT NOT NULL,
//     created_at DATETIME NOT NULL,
//     updated_at DATETIME NOT NULL,
//     FOREIGN KEY (dups_parent_id) REFERENCES dups_parent(id)
// );

// CREATE TABLE comment_replies (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     comment_id INTEGER NOT NULL,
//     user_id INTEGER NOT NULL,
//     reply TEXT NOT NULL,
//     created_at DATETIME NOT NULL,
//     updated_at DATETIME NOT NULL,
//     FOREIGN KEY (comment_id) REFERENCES comments(id)
// );

// -- user_permissionにデータを2レコード挿入する
// INSERT INTO user_permission (id, permission,
// readable,
// writable,
// deletable,
// likable,
// created_at, updated_at) VALUES (1, 'guest', 1, 0, 0, 0, DATETIME('now'), DATETIME('now'));
// INSERT INTO user_permission (id, permission,
// readable,
// writable,
// deletable,
// likable,
// created_at, updated_at) VALUES (2, 'user', 1, 1, 1, 1, DATETIME('now'), DATETIME('now'));

// -- usersにデータを3レコード挿入する
// INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (1, 'GUEST', 'GUEST_PASS', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'name1', 'password1', DATETIME('now'), DATETIME('now'));
// INSERT INTO users (user_permission_id, username, userpassword, created_at, updated_at) VALUES (2, 'name2', 'password2', DATETIME('now'), DATETIME('now'));

// -- likesにデータを3レコード挿入する
// -- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 1, DATETIME('now'), DATETIME('now'));
// -- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 2, DATETIME('now'), DATETIME('now'));
// -- INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (1, 3, DATETIME('now'), DATETIME('now'));

const R = require('ramda');
const express = require('express');
const sqlite = require('better-sqlite3');
const db = new sqlite('./.data/dup.sqlite3');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
const port = 8000;
app.listen(port, "0.0.0.0", () => console.log(`App listening!! at http://localhost:${port}`) );
// app.listen(port, () => console.log(`App listening!! at http://localhost:${port}`) );
app.get('/', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(1);
    console.log('Hello World, this is the TEST mode!!!!');
    console.log(JSON.stringify(user).length);
    res.json({message: 'Hello World, this is the TEST mode!!!!'});
});

const now = () => new Date().toISOString();
const true_if_within_4000_characters_and_not_empty = (str) => str.length > 2 && str.length <= 4000 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;
const true_if_within_10_characters_and_not_empty = (str) => str.length > 2 && str.length <= 10 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;
// validationの関数。falsyでは無い1文字以上10文字以下で記号を含まない場合はtrue、そうではない場合はfalse
const true_if_within_10_characters_and_not_empty_and_not_include_symbol = (str) => str.length >= 1  && str.length <= 10 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false && !str.match(/[^A-Za-z0-9]/) ? true : false;

// expressの一般的なエラーのレスポンス。引数としてエラー文字列を含めて呼び出す
const error_response = (res, error_message) => res.json({error: error_message});
const get_user_with_permission = (REQ) => db.prepare(`
SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission,
user_permission.deletable AS deletable,
user_permission.writable AS writable,
user_permission.readable AS readable,
user_permission.likable AS likable,
user_permission.commentable AS commentable
FROM users
LEFT JOIN user_permission ON users.user_permission_id = user_permission.id
WHERE users.username = ? AND users.userpassword = ?
`).get(REQ.body.name, REQ.body.password);

// '/read_dups_parent2'というGETのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsとそれを紐づけるuserを取得する。
// それらの全てのidとcontent1とcontent2とcontent3を返すとcreated_atとupdated_atとuserのnameを返す
// dups_parentのlike数も返す、dups_parentに紐づくtagも返す。dups_parentに紐づくcommentとcomment_repliesも返す。
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.get('/read_dups_parent2', (req, res) => {
  try {
    const get_order_by_from_req_query = (REQ) => {
        switch (`${REQ.query.ORDER_BY}:${REQ.query.ASC_OR_DESC}`) {
            case 'likes_count:ASC': return 'likes_count ASC';
            case 'likes_count:DESC': return 'likes_count DESC';
            default: return 'dups_parent.id DESC';
        }
    }
    const get_tag_filter_by_from_req_query = (REQ) => {
        let tags = REQ.query.TAGS === undefined ? '' : REQ.query.TAGS.replace(/\s+/g, '');
        tags = tags.split(',');
        // REQ.query.TAGSに空白が含まれている場合、正しく動作しないので、空白を削除する
        tags = tags.filter((tag) => tag !== '');
        // エラーチェックして早期リターン
        if (tags.length === 0) return '';
        if (tags.length > 5) return '';
        if (tags.some((tag) => !true_if_within_10_characters_and_not_empty_and_not_include_symbol(tag))) return '';
        console.log('tags', tags);
        const all_sql_keywords_list = ['ABORT', 'ACTION', 'ADD', 'AFTER', 'ALL', 'ALTER', 'ANALYZE', 'AND', 'AS', 'ASC', 'ATTACH', 'AUTOINCREMENT', 'BEFORE', 'BEGIN', 'BETWEEN', 'BY', 'CASCADE', 'CASE', 'CAST', 'CHECK', 'COLLATE', 'COLUMN', 'COMMIT', 'CONFLICT', 'CONSTRAINT', 'CREATE', 'CROSS', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP', 'DATABASE', 'DEFAULT', 'DEFERRABLE', 'DEFERRED', 'DELETE', 'DESC', 'DETACH', 'DISTINCT', 'DROP', 'EACH', 'ELSE', 'END', 'ESCAPE', 'EXCEPT', 'EXCLUSIVE', 'EXISTS', 'EXPLAIN', 'FAIL', 'FOR', 'FOREIGN', 'FROM', 'FULL', 'GLOB', 'GROUP', 'HAVING', 'IF', 'IGNORE', 'IMMEDIATE', 'IN', 'INDEX', 'INDEXED', 'INITIALLY', 'INNER', 'INSERT', 'INSTEAD', 'INTERSECT', 'INTO', 'IS', 'ISNULL', 'JOIN', 'KEY', 'LEFT', 'LIKE', 'LIMIT', 'MATCH', 'NATURAL', 'NO', 'NOT', 'NOTNULL', 'NULL', 'OF', 'OFFSET', 'ON', 'OR', 'ORDER', 'OUTER', 'PLAN', 'PRAGMA', 'PRIMARY', 'QUERY', 'RAISE', 'RECURSIVE', 'REFERENCES', 'REGEXP', 'REINDEX', 'RELEASE', 'RENAME', 'REPLACE', 'RESTRICT', 'RIGHT', 'ROLLBACK', 'ROW', 'SAVEPOINT', 'SELECT', 'SET', 'TABLE', 'TEMP', 'TEMPORARY', 'THEN', 'TO', 'TRANSACTION', 'TRIGGER', 'UNION', 'UNIQUE', 'UPDATE', 'USING', 'VACUUM', 'VALUES', 'VIEW', 'VIRTUAL', 'WHEN', 'WHERE', 'WITH', 'WITHOUT'];
        switch (`${tags}`) {
            case '': return '';
            default:
                // REQ.query.TAGSに記号やsqliteのキーワードや空白が含まれていた場合は空文字列を返す
                REQ.query.TAGS.split(',').forEach((tag) => {
                    if (all_sql_keywords_list.includes(tag) || tag.match(/[^A-Za-z0-9]/) || tag === '') {
                        return '';
                    }
                });
                return 'WHERE tags.tag IN ' + `('${tags.join("','")}')`;
        }
    }

console.log(
    get_tag_filter_by_from_req_query(req)
);

    const dups_parent = db.prepare(`
      SELECT
        dups_parent.id AS dups_parent_id,
        dups_parent.created_at AS dups_parent_created_at,
        dups_parent.updated_at AS dups_parent_updated_at,
        users.username AS user_name,
        GROUP_CONCAT(DISTINCT dups.content_group_id) AS dups_content_group_id,
        (SELECT COUNT(id) AS likes_count FROM likes WHERE dups_parent_id = dups_parent.id) AS likes_count
      FROM dups_parent
      LEFT JOIN users ON dups_parent.user_id = users.id
      LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
      LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
      LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
      LEFT JOIN comments ON dups_parent.id = comments.dups_parent_id
      LEFT JOIN comment_replies ON comments.id = comment_replies.comment_id
      LEFT JOIN likes ON likes.dups_parent_id = dups_parent.id
        ${get_tag_filter_by_from_req_query(req)}
      GROUP BY dups_parent.id
      ORDER BY ${get_order_by_from_req_query(req)}
    `).all();

    const result = dups_parent.map(parent => {
      const dups = db.prepare(`
        SELECT
          dups.id AS dups_id,
          dups.content_1 AS dups_content_1,
          dups.content_2 AS dups_content_2,
          dups.content_3 AS dups_content_3,
          dups.content_4 AS dups_content_4
        FROM dups
        WHERE dups.dups_parent_id = ? 
      `).all(parent.dups_parent_id);

      const tags = db.prepare(`
        SELECT
          tags.id AS tag_id,
          tags.tag AS tag
        FROM dups_parent_tags
        JOIN tags ON dups_parent_tags.tag_id = tags.id
        WHERE dups_parent_tags.dups_parent_id = ?
      `).all(parent.dups_parent_id);

      const comments = db.prepare(`
        SELECT
          comments.id AS comment_id,
          comments.comment AS comment,
          comments.created_at AS comment_created_at,
          comments.updated_at AS comment_updated_at,
          users.username AS comment_user_name,
          users.id AS comment_user_id
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.dups_parent_id = ?
      `).all(parent.dups_parent_id);

        const comments_and_replies = comments.map(comment => {
            const comment_replies = db.prepare(`
                SELECT
                    comment_replies.id AS comment_reply_id,
                    comment_replies.comment_id AS comment_reply_comment_id,
                    comment_replies.reply AS comment_reply,
                    comment_replies.created_at AS comment_reply_created_at,
                    comment_replies.updated_at AS comment_reply_updated_at,
                    users.username AS comment_user_name,
                    users.id AS comment_user_id
                FROM comment_replies
                JOIN users ON comment_replies.user_id = users.id
                WHERE comment_replies.comment_id = ?
            `).all(comment.comment_id);
            return {
                ...comment,
                comment_replies,
                tags,
            }
        });


      return {
        ...parent,
        dups,
        tags,
        comments_and_replies,
      };
    });

    res.json(result);
  } catch (error) {
    console.log(error);
    error_response(res, '原因不明のエラー' + error);
  }
});

// '/insert_dup'というPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを作成する。
app.post('/insert_dup', (req, res) => {
    try {
    req.body.B_C_list.forEach((EACH_CONTENT) => {
        true_if_within_4000_characters_and_not_empty(EACH_CONTENT.join("")) ? null : (()=>{throw new Error('4000文字以内で入力して')})();
    });
    const user_with_permission = get_user_with_permission(req);
    user_with_permission ? null : (()=>{throw new Error('ユーザーが存在しません')})();
    user_with_permission.writable === 1 ? null : (()=>{throw new Error('書き込み権限がありません')})();
    db.prepare('INSERT INTO dups_parent (user_id, created_at, updated_at) VALUES (?, ?, ?)').run(user_with_permission.user_id, now(), now()) ? null : (()=>{throw new Error('dups_parentに追加できませんでした')})();
    const dups_parent_id = db.prepare('SELECT id FROM dups_parent ORDER BY id DESC LIMIT 1').get().id;
    console.log(dups_parent_id);
    req.body.B_C_list.forEach((EACH_CONTENT, CONTENT_GROUP_ID) => {
        console.log(EACH_CONTENT);
        db.prepare('INSERT INTO dups (dups_parent_id, content_group_id, content_1, content_2, content_3, content_4) VALUES (?, ?, ?, ?, ?, ?)')
            .run(dups_parent_id, CONTENT_GROUP_ID, EACH_CONTENT[0], EACH_CONTENT[1], EACH_CONTENT[2], EACH_CONTENT[3]) ? null : (()=>{throw new Error('dupsに追加できませんでした')})();

    });

    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

// '/delete_dup'というPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを削除する。
// error_responseを使ってエラーを返すパターンとしては、
// 1. ユーザーが存在しません
// 2. 削除権限がありません
// 3. dupsを削除できませんでした
// 4. dups_parentを削除できませんでした
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.post('/delete_dup', (req, res) => {
    try {
    const user_with_permission = db.prepare('SELECT users.id AS user_id, users.username AS username, user_permission.permission AS user_permission FROM users LEFT JOIN user_permission ON users.user_permission_id = user_permission.id WHERE users.username = ? AND users.userpassword = ?').get(req.body.name, req.body.password) ? null : (()=>{throw new Error('ユーザーが存在しません')})();
    user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
    db.prepare('DELETE FROM dups WHERE dups_parent_id = ?').run(req.body.dups_parent_id) ? null : (()=>{throw new Error('dupsを削除できませんでした')})();
    db.prepare('DELETE FROM dups_parent WHERE id = ?').run(req.body.dups_parent_id) ? null : (()=>{throw new Error('dups_parentを削除できませんでした')})();
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

// delete_all_dups_and_dups_parentというPOSTのリクエストを受け取るエンドポイントで、dups_parentとそれに付随するdupsを全て削除する。
app.post('/delete_all_dups_and_dups_parent', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission ? null : (()=>{throw new Error('ユーザーが存在しません')})();
    user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
    db.prepare('DELETE FROM replies').run() ? null : (()=>{throw new Error('repliesを削除できませんでした')})();
    db.prepare('DELETE FROM comments').run() ? null : (()=>{throw new Error('commentsを削除できませんでした')})();
    db.prepare('DELETE FROM dups').run() ? null : (()=>{throw new Error('dupsを削除できませんでした')})();
    db.prepare('DELETE FROM dups_parent_tags').run() ? null : (()=>{throw new Error('dups_parent_tagsを削除できませんでした')})();
    db.prepara('DELETE FROM likes').run() ? null : (()=>{throw new Error('likesを削除できませんでした')})();
    db.prepare('DELETE FROM tags').run() ? null : (()=>{throw new Error('tagsを削除できませんでした')})();
    db.prepare('DELETE FROM dups_parent').run() ? null : (()=>{throw new Error('dups_parentを削除できませんでした')})();
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

// 'like_dups_parent'というPOSTのリクエストを受け取るエンドポイントで、dups_parentのlikeを増やす。
// error_responseを使ってエラーを返すパターンとしては、
// 1. ユーザーが存在しません
// 2. いいね権限がありません
// 3. いいねを追加できませんでした
// 原因不明のエラーの場合は適当なエラーレスポンスを返す
app.post('/like_dups_parent', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.likable === 1 ? null : (()=>{throw new Error('いいね権限がありません')})();
    // 既にいいねしているかどうかを確認する
    const already_liked = db.prepare('SELECT * FROM likes WHERE dups_parent_id = ? AND user_id = ?').get(req.body.dups_parent_id, user_with_permission.user_id);
    already_liked ? (()=>{throw new Error('既にいいねしています')})() : null;
    db.prepare('INSERT INTO likes (dups_parent_id, user_id, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(req.body.dups_parent_id, user_with_permission.user_id, now(), now())
            ? null : (()=>{throw new Error('いいねを追加できませんでした')})();
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

app.post('/delete_like_dups_parent', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.likable === 1 ? null : (()=>{throw new Error('いいね権限がありません')})();
    // 既にいいねしているかどうかを確認する
    const already_liked = db.prepare('SELECT * FROM likes WHERE dups_parent_id = ? AND user_id = ?').get(req.body.dups_parent_id, user_with_permission.user_id);
    already_liked ? null : (()=>{throw new Error('いいねしていません')})();
    db.prepare('DELETE FROM likes WHERE dups_parent_id = ? AND user_id = ?').run(req.body.dups_parent_id, user_with_permission.user_id)
        ? null : (()=>{throw new Error('いいねを削除できませんでした')})();
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

app.post('/add_tag', (req, res) => {
    // console.log(
    //     req.body.tag,
    //     req.body.tag.length
    // )
    try {
    // true_if_within_10_characters_and_not_empty(req.body.tag) ? null : (()=>{throw new Error('1文字以上10文字以内で入力してください')})();
    true_if_within_10_characters_and_not_empty_and_not_include_symbol(req.body.tag) ? null : (()=>{throw new Error('1文字以上10文字以内で入力してください')})();
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.writable === 1 ? null : (()=>{throw new Error('書き込み権限がありません')})();
    // 同じタグがあればtagテーブルには追加しない、同じタグがなければtagテーブルに追加する
    db.prepare('SELECT * FROM tags WHERE tag = ?').get(req.body.tag) ? null : db.prepare('INSERT INTO tags (tag) VALUES (?)').run(req.body.tag);
    const tag = db.prepare('SELECT * FROM tags WHERE tag = ?').get(req.body.tag);
    const tag_id = tag.id;
    // dups_parentと紐づいたdups_parent_tagsがあればdups_parent_tagsに追加しない、dups_parentと紐づいたdups_parent_tagsがなければdups_parent_tagsに追加する
    db.prepare('SELECT * FROM dups_parent_tags WHERE dups_parent_id = ? AND tag_id = ?').get(req.body.dups_parent_id, tag_id)
        ? null
        : db.prepare('INSERT INTO dups_parent_tags (dups_parent_id, tag_id, created_at, updated_at) VALUES (?, ?, ?, ?)').run(req.body.dups_parent_id, tag_id, now(), now());
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, 'ERROR: ' + error);
    }
});



app.post('/get_dups_parents', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.readable === 1 ? null : (()=>{throw new Error('読み込み権限がありません')})();
    const dups_parents = db.prepare(`SELECT * FROM dups_parents WHERE dups_parent LIKE '%${req.body.dups_parent}%' LIMIT 10`).all();
    res.json({message: 'success', dups_parents});
    } catch (error) {
        console.log(error);
        error_response(res, 'ERROR: ' + error);
    }
});

// このAPIはdups_parentを削除するAPIではなく、dups_parentと紐づいたタグを削除するAPI
app.post('/delete_dups_parent', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
    // dups_parentと紐づいたdups_parent_tagsを削除する
    db.prepare('DELETE FROM dups_parent_tags WHERE dups_parent_id = ?').run(req.body.dups_parent_id);
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, 'ERROR: ' + error);
    }
});

// 該当tagを全部削除するAPI。多分使う機会が無いのでコメントアウトしておく
// app.post('/delete_tag', (req, res) => {
//     try {
//     const user_with_permission = get_user_with_permission(req);
//     user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
//     db.prepare('DELETE FROM tags WHERE id = ?').run(req.body.id);
//     // tagsテーブルから削除したタグに紐づいたdups_parent_tagsを削除する
//     db.prepare('DELETE FROM dups_parent_tags WHERE tag_id = ?').run(req.body.id);
//     res.json({message: 'success'});
//     } catch (error) {
//         console.log(error);
//         error_response(res, '原因不明のエラー' + error);
//     }
// });

// dups_parent_tagsを削除し、tagが他で利用されていなければtagsテーブルからも削除するAPI
app.post('/delete_dups_parent_tags', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
    db.prepare('DELETE FROM dups_parent_tags WHERE dups_parent_id = ? AND tag_id = ?').run(req.body.dups_parent_id, req.body.tag_id);
    // dups_parent_tagsテーブルから削除したdups_parentに紐づいたタグが他になければtagsテーブルからも削除する
    db.prepare('SELECT * FROM dups_parent_tags WHERE tag_id = ?').get(req.body.tag_id) ? null : db.prepare('DELETE FROM tags WHERE id = ?').run(req.body.tag_id);
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

app.post('/read_all_tags', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.readable === 1 ? null : (()=>{throw new Error('読み込み権限がありません')})();
    const tags = db.prepare('SELECT * FROM tags').all();
    res.json({tags: tags});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});

app.post('/delete_tag', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.deletable === 1 ? null : (()=>{throw new Error('削除権限がありません')})();
    db.prepare('DELETE FROM dups_parent_tags WHERE tag_id = ?').run(req.body.tag_id);
    // 中間テーブルから該当のタグが全て削除された場合、タグテーブルからも削除する
    db.prepare('DELETE FROM tags WHERE id = ? AND id NOT IN (SELECT tag_id FROM dups_parent_tags)').run(req.body.tag_id);
    res.json({message: 'success'});
    } catch (error) {
        console.log(error);
        error_response(res, '原因不明のエラー' + error);
    }
});


app.post('/get_tags_for_autocomplete', (req, res) => {
    try {
    console.log(req.body.tag);
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.readable === 1 ? null : (()=>{throw new Error('読み込み権限がありません')})();
    const tags = db.prepare(`SELECT * FROM tags WHERE tag LIKE '%${req.body.tag}%' LIMIT 100`).all();
    res.json({message: 'success', tags});
    } catch (error) {
    console.log(error);
    error_response(res, 'ERROR: ' + error);
    }
});






// コメントを追加するAPI。コメントはdups_parentに紐づく。1つのコメントの最大文字数は1文字以上10文字以内。アカウント一つにつきコメントは1つまで。
app.post('/add_comment', (req, res) => {
    try {
    // 1つのコメントの最大文字数は1文字以上10文字以内
    req.body.comment.length >= 1 && req.body.comment.length <= 10 ? null : (()=>{throw new Error('コメントは1文字以上10文字以内です')})();

    const user_with_permission = get_user_with_permission(req);
    user_with_permission.commentable === 1 ? null : (()=>{throw new Error('コメント権限がありません')})();
    // アカウント一つにつき1つのdups_parentに対して1つのコメントしかできない
    db.prepare('SELECT * FROM comments WHERE dups_parent_id = ? AND user_id = ?').get(req.body.dups_parent_id, user_with_permission.user_id) ? (()=>{throw new Error('アカウント一つにつき1つのdups_parentに対して1つのコメントしかできません')})() : null;
    db.prepare('INSERT INTO comments (dups_parent_id, comment, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.dups_parent_id, req.body.comment, user_with_permission.user_id, now(), now());
    res.json({message: 'success'});
    } catch (error) {
    console.log(error);
    error_response(res, 'ERROR: ' + error);
    }
});


app.post('/delete_comment', (req, res) => { // コメントを削除するAPI。コメントはdups_parentに紐づく。コメントを削除する権限はコメントしたユーザーのみ。コメントを削除すると、そのコメントに紐づくcomment_repliesも全て削除される。
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.commentable === 1 ? null : (()=>{throw new Error('コメント権限がありません')})();
    db.prepare('SELECT * FROM comments WHERE id = ? AND user_id = ?').get(req.body.comment_id, user_with_permission.user_id) ? null : (()=>{throw new Error('コメントを削除する権限がありません')})(); // 該当のコメントが、そのコメントを投稿したユーザーか確認する
    db.prepare('DELETE FROM comment_replies WHERE comment_id = ?').run(req.body.comment_id);
    db.prepare('DELETE FROM comments WHERE id = ?').run(req.body.comment_id);
    res.json({message: 'success'});
    } catch (error) {
    console.log(error);
    error_response(res, 'ERROR: ' + error);
    }
});

// comment_repliesに返信を追加するAPI。返信はcommentに紐づく。1つの返信の最大文字数は1文字以上10文字以内。アカウント一つにつき一つのコメントに対する返信は1つまで。
app.post('/add_comment_reply', (req, res) => {
    try {
    // req.body.replyには,を含めることができない(sqlのgroup_concatのため)
    req.body.reply.includes(',') ? (() => { throw new Error('返信に,(カンマ)を含めることはできません'); })() : null;
    req.body.reply !== undefined ? null : (() => { throw new Error('返信が空です'); })();
    req.body.reply.length >= 1 && req.body.reply.length <= 10 ? null : (() => { throw new Error('返信は1文字以上10文字以内です'); })();
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.commentable === 1 ? null : (()=>{throw new Error('コメント権限がありません')})();
    db.prepare('SELECT * FROM comment_replies WHERE comment_id = ? AND user_id = ?').get(req.body.comment_id, user_with_permission.user_id ) ? (() => { throw new Error('アカウント1つにつき1つのコメントに対する返信は1つまで'); })() : null;
    db.prepare('INSERT INTO comment_replies (comment_id, reply, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(req.body.comment_id, req.body.reply, user_with_permission.user_id, now(), now());
    res.json({message: 'success'});
    } catch (error) {
    console.log(error);
    error_response(res, 'ERROR: ' + error);
    }
});

// comment_repliesを削除するAPI。返信はcommentに紐づく。返信を削除する権限は返信したユーザーのみ
app.post('/delete_comment_reply', (req, res) => {
    try {
    const user_with_permission = get_user_with_permission(req);
    user_with_permission.commentable === 1 ? null : (()=>{throw new Error('コメント権限がありません')})();
    // const res = db.prepare('SELECT * FROM comment_replies WHERE id = ? AND user_id = ?').get(req.body.comment_reply_id, user_with_permission.user_id)
    db.prepare('SELECT * FROM comment_replies WHERE id = ? AND user_id = ?').get(req.body.comment_reply_id, user_with_permission.user_id) ? null : (()=>{throw new Error('返信を削除する権限がありません')})(); // 該当のコメントが、そのコメントを投稿したユーザーか確認する
    // console.log(res);
    db.prepare('DELETE FROM comment_replies WHERE id = ? and user_id = ?').run(req.body.comment_reply_id, user_with_permission.user_id);
    res.json({message: 'success'});
    } catch (error) {
    console.log(error);
    error_response(res, 'ERROR: ' + error);
    }
});

function limitDataSize(data, MAX_BYTE_SIZE) {
  const serializedData = JSON.stringify(data);
  if (serializedData.length <= MAX_BYTE_SIZE) {
    return data;
  }
  const change_kb_mb_gb = (BYTE_SIZE) => MAX_BYTE_SIZE / 1000 / 1000 / 1000 >= 1 ? MAX_BYTE_SIZE / 1000 / 1000 / 1000 + 'GB' : MAX_BYTE_SIZE / 1000 / 1000 >= 1 ? MAX_BYTE_SIZE / 1000 / 1000 + 'MB' : MAX_BYTE_SIZE / 1000 >= 1 ? MAX_BYTE_SIZE / 1000 + 'KB' : MAX_BYTE_SIZE + 'B';
  throw new Error('データサイズが上限を超えました: '+ change_kb_mb_gb(MAX_BYTE_SIZE));
}

// SQLで一人のユーザーが保持できるデータ量を100kb以下に抑える関数をlimitDataSizeと組み合わせて作る
// 一人のユーザーのデータ量というのはそのユーザーが投稿したdupsやlikeやtagやコメントや返信のデータ量の合計のこと
function check_user_data_size(user_id) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    const dups = db.prepare('SELECT * FROM dups WHERE user_id = ?').all(user_id);
    const comments = db.prepare('SELECT * FROM comments WHERE user_id = ?').all(user_id);
    const comment_replies = db.prepare('SELECT * FROM comment_replies WHERE user_id = ?').all(user_id);
    const likes = db.prepare('SELECT * FROM likes WHERE user_id = ?').all(user_id);
    const tags = db.prepare('SELECT * FROM tags WHERE user_id = ?').all(user_id);
    const user_data = {
        user: user,
        dups: dups,
        comments: comments,
        comment_replies: comment_replies,
        likes: likes,
        tags: tags
    };
    const limited_user_data = limitDataSize(user_data);
    return limited_user_data;
}

// On Glitch, projects that are created for free are limited to 200MB of disk space.
// Boosted apps can use up to 400MB of disk space.
// 400mbを40kbで割ると10000になるので、一人のユーザーが40kb保持できるとすると、ユーザー数は10000人までとなる
// 400mbを400kbで割ると1000になるので、一人のユーザーが400kb保持できるとすると、ユーザー数は1000人までとなる
 