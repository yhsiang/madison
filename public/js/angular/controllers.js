/**
*	Document Viewer Controllers
*/

function ReaderController($scope, $http, annotationService){
	$scope.annotations = [];
	$scope.doc = doc;

	$scope.$on('annotationsUpdated', function(){
		$scope.annotations = annotationService.annotations;
		$scope.$apply();
	});

	$scope.init = function(docId){
		$scope.user = user;
		$scope.doc = doc;

		$scope.getSupported();
	};

	$scope.getSupported = function(){
		if($scope.user.id !== ''){
			$http.get('/api/users/' + user.id + '/support/' + doc.id)
			.success(function(data){
				switch(data.meta_value){
					case "1":
						$scope.supported = true;
						break;
					case "":
						$scope.opposed = true;
						break;
					default:
						$scope.supported = null;
						$scope.opposed = null;
				}
			}).error(function(data){
				console.error("Unable to get support info for user %o and doc %o", user, doc);
			});
		}
	};

	$scope.support = function(supported, $event){
		$http.post('/api/docs/' + $scope.doc.id + '/support', {'support': supported})
		.success(function(data, status, headers, config){
			//Parse data to see what user's action is currently
			if(data.support === null){
				$scope.supported = false;
				$scope.opposed = false;
			}else{
				$scope.supported = data.support;
				$scope.opposed = !data.support;
			}
		})
		.error(function(data, status, headers, config){
			console.error("Error posting support: %o", data);
		});
	};
}

function ParticipateController($scope, $http, annotationService, createLoginPopup){
	$scope.annotations = [];
	$scope.comments = [];
	$scope.activities = [];
	$scope.supported = null;
	$scope.opposed = false;

	$scope.init = function(docId){
		$scope.getDocComments(docId);
		$scope.user = user;
		$scope.doc = doc;
	};

	$scope.$on('annotationsUpdated', function(){
		angular.forEach(annotationService.annotations, function(annotation){
			if($.inArray(annotation, $scope.activities) < 0){
				annotation.label = 'annotation';
				annotation.commentsCollapsed = true;
				$scope.activities.push(annotation);
			}
			
		});
		
		$scope.$apply();
	});

	$scope.getDocComments = function(docId){
		$http({method: 'GET', url: '/api/docs/' + docId + '/comments'})
		.success(function(data, status, headers, config){
			angular.forEach(data, function(comment){
				comment.label = 'comment';
				comment.commentsCollapsed = true;
				$scope.activities.push(comment);
			});
		})
		.error(function(data, status, headers, config){
			console.error("Error loading comments: %o", data);
		});
	};

	$scope.commentSubmit = function(form){
		comment = angular.copy($scope.comment);
		comment.user = $scope.user;
		comment.doc = $scope.doc;

		$http.post('/api/docs/' + comment.doc.id + '/comments', {'comment': comment})
		.success(function(data, status, headers, config){
			comment.label = 'comment';
			comment.user.fname = comment.user.name;
			$scope.activities.push(comment);
			$scope.comment.text = '';
		})
		.error(function(data, status, headers, config){
			console.error("Error posting comment: %o", data);
		});
	};

	$scope.activityOrder = function(activity){
		var popularity = activity.likes - activity.dislikes;

		return popularity;
	};

	$scope.addAction = function(activity, action, $event){
		if($scope.user.id !== ''){
			$http.post('/api/docs/' + doc.id + '/' + activity.label + 's/' + activity.id + '/' + action)
			.success(function(data){
				activity.likes = data.likes;
				activity.dislikes = data.dislikes;
				activity.flags = data.flags;
			}).error(function(data){
				console.error(data);
			});
		}else{
			createLoginPopup($event);
		}
		
	};

	$scope.collapseComments = function(activity) {
		activity.commentsCollapsed = !activity.commentsCollapsed;
	};

	$scope.subcommentSubmit = function(activity, subcomment) {
		subcomment.user = $scope.user;

		$.post('/api/docs/' + doc.id + '/' + activity.label + 's/' + activity.id + '/comments', {'comment': subcomment})
		.success(function(data){
			activity.comments.push(data);
			subcomment.text = '';
			subcomment.user = '';
			$scope.$apply();
		}).error(function(data){
			console.error(data);
		});
	};
}

/**
*	Page Controllers
*/

function HomePageController($scope, $http, $filter){
	$scope.docs = [];
	$scope.categories = [];
	$scope.sponsors = [];
	$scope.statuses = [];
	$scope.dates = [];
	$scope.dateSort = '';
	$scope.select2 = '';
	$scope.docSort = "created_at";
	$scope.reverse = true;

	$scope.init = function(){
		$scope.getDocs();

		$scope.select2Config = {
			multiple: true,
			allowClear: true,
			placeholder: "Filter documents by category, sponsor, or status"
		};

		$scope.dateSortConfig = {
			allowClear: true,
			placeholder: "Sort By Date"
		};
	};

	$scope.docFilter = function(doc){

		var show = false;

		if(typeof $scope.select2 != 'undefined' && $scope.select2 !== ''){
			var cont = true;

			angular.forEach(doc.categories, function(category){
				if(category.name == $scope.select2 && cont){
					show =  true;
					cont = false;
				}
			});

			angular.forEach(doc.sponsor, function(sponsor){
				if(sponsor.id == $scope.select2 && cont){
					show = true;
					cont = false;
				}
			});

			angular.forEach(doc.statuses, function(status){
				if(status.id == $scope.select2 && cont){
					show = true;
					cont = false;
				}
			});

		}else{
			show = true;
		}

		return show;
	};

	$scope.getDocs = function(){
		$http.get('/api/docs')
		.success(function(data, status, headers, config){

			angular.forEach(data, function(doc, key){
				doc.updated_at = Date.parse(doc.updated_at);
				doc.created_at = Date.parse(doc.created_at);

				$scope.docs.push(doc);

				angular.forEach(doc.categories, function(category){
					var found = $filter('filter')($scope.categories, category, true);

					if(!found.length){
						$scope.categories.push(category.name);
					}
				});

				angular.forEach(doc.sponsor, function(sponsor){
					var found = $filter('filter')($scope.sponsors, sponsor, true);

					if(!found.length){
						$scope.sponsors.push(sponsor);
					}
				});

				angular.forEach(doc.statuses, function(status){
					var found = $filter('filter')($scope.statuses, status, true);

					if(!found.length){
						$scope.statuses.push(status);
					}
				});

				angular.forEach(doc.dates, function(date){
					date.date = Date.parse(date.date);
				});
			});

		})
		.error(function(data){
			console.error("Unable to get documents: %o", data);
		});
	};
}

function UserPageController($scope, $http, $location){
	$scope.user = {};
	$scope.meta = '';
	$scope.docs = [];
	$scope.activities = [];
	$scope.verified = false;

	$scope.init = function(){
		$scope.getUser();
	};

	$scope.getUser = function(){
		var abs = $location.absUrl();
		var id = abs.match(/.*\/(\d+)$/);
		id = id[1];

		$http.get('/api/user/' + id)
		.success(function(data){
			$scope.user = angular.copy(data);
			$scope.meta = angular.copy(data.user_meta);

			angular.forEach(data.docs, function(doc){
				$scope.docs.push(doc);
			});

			angular.forEach(data.comments, function(comment){
				comment.label = 'comment';
				$scope.activities.push(comment);
			});

			angular.forEach(data.annotations, function(annotation){
				annotation.label = 'annotation';
				$scope.activities.push(annotation);
			});

			angular.forEach($scope.user.user_meta, function(meta){
				var cont = true;

				if(meta.meta_key == 'verify' && meta.meta_value == 'verified' && cont){
					$scope.verified = true;
					cont = false;
				}
			});

			$scope.user.created_at = Date.parse($scope.user.created_at);

		}).error(function(data){
			console.error("Unable to retrieve user: %o", data);
		});
	};

	$scope.showVerified = function(){
		if($scope.user.docs && $scope.user.docs.length > 0){
			return true;
		}

		return false;
	};

	$scope.activityOrder = function(activity){
		return Date.parse(activity.created_at);
	};

}

/**
*	Dashboard Controllers
*/

function DashboardVerifyController($scope, $http){
	$scope.requests = [];

	$scope.init = function(){
		$scope.getRequests();
	};

	$scope.getRequests = function(){
		$http.get('/api/user/verify')
		.success(function(data, status, headers, config){
			$scope.requests = data;
		})
		.error(function(data, status, headers, config){
			console.error(data);
		});
	};

	$scope.update = function(request, status, event){
		$http.post('/api/user/verify', {'request': request, 'status': status})
		.success(function(data){
			request.meta_value = status;
		})
		.error(function(data, status, headers, config){
			console.error(data);
		});
	};
}

function DashboardSettingsController($scope, $http){
	$scope.admins = [];

	$scope.getAdmins = function(){
		$http.get('/api/user/admin')
		.success(function(data){
			$scope.admins = data;
		})
		.error(function(data){
			console.error(data);
		});
	};

	$scope.saveAdmin = function(admin){
		admin.saved = false;

		$http.post('/api/user/admin', {'admin': admin})
		.success(function(data){
			admin.saved = true;
		})
		.error(function(data){
			console.error(data);
		});
	};

	$scope.init = function(){
		$scope.getAdmins();
	};
}

function DashboardEditorController($scope, $http, $timeout, $location, $filter)
{
	$scope.doc = {};
	$scope.sponsor = {};
	$scope.status = {};
	$scope.newdate = {label: '', date: new Date()};
	$scope.verifiedUsers = [];
	$scope.categories = [];
	$scope.suggestedCategories = [];
	$scope.suggestedStatuses = [];
	$scope.dates = [];

	$scope.init = function(){
		var abs = $location.absUrl();
		var id = abs.match(/.*\/(\d+)$/)[1];

		var docDone = $scope.getDoc(id);

		$scope.getAllCategories();
		$scope.getVerifiedUsers();
		$scope.setSelectOptions();

		var initCategories = true;
		var initSponsor = true;
		var initStatus = true;
		var initDoc = true;
		var initDates = true;

		docDone.then(function() {
			new Markdown.Editor(Markdown.getSanitizingConverter()).run();

			$scope.getDocSponsor().then(function(){
				$scope.$watch('sponsor', function(value){
					if(initSponsor){
						$timeout(function(){ initSponsor = false; });
					}else{
						$scope.saveSponsor();
					}
				});
			});

			$scope.getDocStatus().then(function(){
				$scope.$watch('status', function(value){
					if(initStatus){
						$timeout(function(){ initStatus = false; });
					}else{
						$scope.saveStatus();
					}
				});
			});

			$scope.getDocCategories().then(function(){
				$scope.$watch('categories', function(values){
					if(initCategories){
						$timeout(function(){ initCategories = false; });
					}else{
						$scope.saveCategories();
					}
				});
			});

			$scope.getDocDates();

			$scope.$watchCollection('[doc.slug, doc.title, doc.content.content]', function(value){
				if(initDoc){
					$timeout(function(){ initDoc = false; });
				}else{
					$scope.doc.slug = clean_slug($scope.doc.slug);
					$scope.saveDoc();
				}
			});
		});	
	};

	$scope.setSelectOptions = function(){
		$scope.categoryOptions = {
			multiple: true,
			simple_tags: true,
			tags: function(){
				return $scope.suggestedCategories;
			},
			results: function(){
				return $scope.categories;
			},
			initSelection: true
		};

		$scope.statusOptions={
			placeholder: "Select Document Status",
			data: function(){
				return $scope.suggestedStatuses;
			},
			results: function(){
				console.log($scope.status, "Scope status");
				return $scope.status;
			},
			createSearchChoice: function(term){
				return { id: term, text: term};
			},
			initSelection: function(element, callback){
				callback(angular.copy($scope.status));
			}
		};

		$scope.sponsorOptions = {
			placeholder: "Select Document Sponsor",
			ajax: {
				url: "/api/user/verify",
				dataType: 'json',
				data: function(term, page){
					return;
				},
				results: function(data, page){
					var returned = [];
					angular.forEach(data, function(verified){
						var text = verified.user.fname + " " + verified.user.lname + " - " + verified.user.email;

						returned.push({ id: verified.user.id, text: text });
					});

					return {results: returned};
				}
			},
			initSelection: function(element, callback){
				callback($scope.sponsor);
			}
		};
	};

	$scope.statusChange = function(status){
		$scope.status = status;
	};

	$scope.sponsorChange = function(sponsor){
		$scope.sponsor = sponsor;
	};

	$scope.categoriesChange = function(categories){
		$scope.categories = categories;
	};

	$scope.getDoc = function(id){
		return $http.get('/api/docs/' + id)
		.success(function(data){
			$scope.doc = data;
		});
	};

	$scope.saveDoc = function(){
		return $http.post('/api/docs/' + $scope.doc.id, $scope.doc)
		.success(function(data){
			console.log("Document saved successfully: %o", data);
		}).error(function(data){
			console.error("Error saving categories for document %o: %o \n %o", $scope.doc, $scope.categories, data);
		});
	};

	$scope.createDate = function(newDate, oldDate){
		if($scope.newdate.label !== ''){
			$scope.newdate.date = $filter('date')(newDate, 'short');

			$http.post('/api/docs/' + $scope.doc.id + '/dates', {date: $scope.newdate})
			.success(function(data){
				data.date = Date.parse(data.date);
				data.$changed = false;
				$scope.dates.push(data);

				$scope.newdate = {label: '', date: new Date()};
			}).error(function(data){
				console.error("Unable to save date: %o", data);
			});
		}
	};

	$scope.deleteDate = function(date){
		$http.delete('/api/docs/' + $scope.doc.id + '/dates/' + date.id)
		.success(function(data){
			var index = $scope.dates.indexOf(date);
			$scope.dates.splice(index, 1);
		}).error(function(data){
			console.error("Unable to delete date: %o", date);
		});
	};

	$scope.saveDate = function(date){
		var sendDate = angular.copy(date);
		sendDate.date = $filter('date')(sendDate.date, 'short');
		
		return $http.put('/api/dates/' + date.id, {date: sendDate})
		.success(function(data){
			date.$changed = false;
			console.log("Date saved successfully: %o", data);
		}).error(function(data){
			console.error("Unable to save date: %o (%o)", date, data);
		});
	};

	$scope.getDocDates = function(){
		return $http.get('/api/docs/' + $scope.doc.id + '/dates')
		.success(function(data){
			angular.forEach(data, function(date, index){
				date.date = Date.parse(date.date);
				date.$changed = false;
				$scope.dates.push(angular.copy(date));

				$scope.$watch('dates[' + index + ']', function(newitem, olditem){
					if(!angular.equals(newitem, olditem) && typeof newitem != 'undefined'){
						newitem.$changed = true;
					}
				}, true);
			});
		}).error(function(data){
			console.error("Error getting dates: %o", data);
		});
	};

	$scope.getVerifiedUsers = function(){
		return $http.get('/api/user/verify')
		.success(function(data){
			angular.forEach(data, function(verified){
				$scope.verifiedUsers.push(angular.copy(verified.user));
			});
		}).error(function(data){
			console.error("Unable to get verified users: %o", data);
		});
	};

	$scope.getDocCategories = function(){
		return $http.get('/api/docs/' + $scope.doc.id + '/categories')
		.success(function(data){
			angular.forEach(data, function(category){
				$scope.categories.push(category.name);
			});
		}).error(function(data){
			console.error("Unable to get categories for document %o: %o", $scope.doc, data);
		});
	};

	$scope.getDocSponsor = function(){
		return $http.get('/api/docs/' + $scope.doc.id + '/sponsor')
		.success(function(data){
			$scope.sponsor = angular.copy({id: data.id, text: data.fname + " " + data.lname + " - " + data.email});
		}).error(function(data){
			console.error("Error getting document sponsor: %o", data);
		});

	};

	$scope.getDocStatus = function(){
		return $http.get('/api/docs/' + $scope.doc.id + '/status')
		.success(function(data){
			$scope.status = angular.copy({id: data.id, text: data.label});
		}).error(function(data){
			console.error("Error getting document status: %o", data);
		});
	};

	$scope.getAllStatuses = function(){
		$http.get('/api/docs/statuses')
		.success(function(data){
			angular.forEach(data, function(status){
				$scope.suggestedStatuses.push(status.label);
			});
		}).error(function(data){
			console.error("Unable to get document statuses: %o", data);
		});
	};

	$scope.getAllCategories = function(){
		return $http.get('/api/docs/categories')
		.success(function(data){
			angular.forEach(data, function(category){
				$scope.suggestedCategories.push(category.name);
			});
		})
		.error(function(data){
			console.error("Unable to get document categories: %o", data);
		});
	};

	$scope.saveStatus = function(){
		return $http.post('/api/docs/' + $scope.doc.id + '/status', {status: $scope.status})
		.success(function(data){
			console.log("Status saved successfully: %o", data);
		}).error(function(data){
			console.error("Error saving status: %o", data);
		});
	};

	$scope.saveSponsor = function(){
		return $http.post('/api/docs/' + $scope.doc.id + '/sponsor', {'sponsor': $scope.sponsor})
		.success(function(data){
			console.log("Sponsor saved successfully: %o", data);
		}).error(function(data){
			console.error("Error saving sponsor: %o", data);
		});
	};

	$scope.saveCategories = function(){
		return $http.post('/api/docs/' + $scope.doc.id + '/categories', {'categories': $scope.categories})
		.success(function(data){
			console.log("Categories saved successfully: %o", data);
		}).error(function(data){
			console.error("Error saving categories for document %o: %o \n %o", $scope.doc, $scope.categories, data);
		});
	};
}

function DashboardRolesController($scope, $http, Users){
	$scope.userOptions = {
		allowClear: true,
		query: function (query) {
			var user = Users.query({email: query});
			console.log(user);
			query.callback(user);
		}
	};
}

/**
*	Dependency Injections
*/

DashboardEditorController.$inject = ['$scope', '$http', '$timeout', '$location', '$filter'];
DashboardSettingsController.$inject = ['$scope', '$http'];
DashboardVerifyController.$inject = ['$scope', '$http'];
DashboardRolesController.$inject = ['$scope', '$http', 'Users'];

HomePageController.$inject = ['$scope', '$http', '$filter'];
UserPageController.$inject = ['$scope', '$http', '$location'];

ReaderController.$inject = ['$scope', '$http', 'annotationService'];
ParticipateController.$inject = ['$scope', '$http', 'annotationService', 'createLoginPopup'];


