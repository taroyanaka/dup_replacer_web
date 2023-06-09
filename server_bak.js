const R = require('ramda');
const express = require('express');
const sqlite = require('better-sqlite3');
const db = new sqlite('.data/dup.sqlite3');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
const cors = require('cors');
app.use(cors());
const port = 8000;
app.listen(port, () => console.log(`App listening!! at http://localhost:${port}`) );

app.get('/', (req, res) => {
    res.json({message: 'Hello World, this is product mode!!!!'});
});

const now = () => new Date().toISOString();
const true_if_within_4000_characters_and_not_empty = (str) => str.length > 2 && str.length <= 4000 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;
const true_if_within_10_characters_and_not_empty = (str) => str.length > 2 && str.length <= 10 && typeof str === 'string' && str !== 'undefined' ? true : false && str !== 'null' ? true : false;
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
    console.log('execute read_dups_parent2!!')
    const likes_ORDER_BY_ASC_OR_DESC = req.query.ORDER_BY_ASC_OR_DESC === 'ASC' ? 'ASC' : 'DESC';
    const dups_parent = db.prepare(`
      SELECT
        dups_parent.id AS dups_parent_id,
        dups_parent.created_at AS dups_parent_created_at,
        dups_parent.updated_at AS dups_parent_updated_at,
        users.username AS user_name,
        GROUP_CONCAT(DISTINCT dups.content_group_id) AS dups_content_group_id,
        COUNT(likes.dups_parent_id) AS likes_count
      FROM dups_parent
      LEFT JOIN users ON dups_parent.user_id = users.id
      LEFT JOIN dups ON dups_parent.id = dups.dups_parent_id
      LEFT JOIN dups_parent_tags ON dups_parent.id = dups_parent_tags.dups_parent_id
      LEFT JOIN tags ON dups_parent_tags.tag_id = tags.id
      LEFT JOIN comments ON dups_parent.id = comments.dups_parent_id
      LEFT JOIN comment_replies ON comments.id = comment_replies.comment_id
      LEFT JOIN likes ON likes.dups_parent_id = dups_parent.id
      GROUP BY dups_parent.id
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
    try {
    true_if_within_10_characters_and_not_empty(req.body.tag) ? null : (()=>{throw new Error('10文字以内で入力してください')})();
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