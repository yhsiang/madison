<?php
/**
 * 	Controller for Document actions
 */
class CommentApiController extends ApiController{

	public function __construct(){
		parent::__construct();

		$this->beforeFilter('auth', array('on' => array('post','put', 'delete')));
	}	
	
	public function getIndex($doc, $comment = null){
		try{
			$userId = null;
			if(Auth::check()){
				$userId = Auth::user()->id;
			}

			$results = Comment::loadComments($doc, $comment, $userId);
		}catch(Exception $e){
			throw $e;
			App::abort(500, $e->getMessage());
		}

		return Response::json($results);
	}

	public function postIndex($doc){
		$comment = Input::get('comment');

		$newComment = new Comment();
		$newComment->user_id = Auth::user()->id;
		$newComment->doc_id = $comment['doc']['id'];
		$newComment->content = $comment['content'];

		$return = $newComment->save();

		return Response::json($return);
	}
}

