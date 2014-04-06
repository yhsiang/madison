@extends('layouts/main')
@section('content')
    <div class="row">
        <ol class="breadcrumb">
            <li><a href="/dashboard">Dashboard</a></li>
            <li class="active">Roles</li>
        </ol>
    </div>
    <div class="row content" ng-controller="DashboardRolesController">
        <h2>Roles</h2>
        <div class="col-md-12">
            <div class="row">
                <div class="col-md-12">
                    <input name="user" type="hidden" ui-select2="userOptions" ng-model="user" data-placeholder="Search for user">
                </div>
            </div>
        </div>
    </div>
@endsection