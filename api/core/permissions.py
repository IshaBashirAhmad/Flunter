from django.contrib.auth import get_user_model
from rest_framework import permissions

User = get_user_model()


class CanSubscribe(permissions.BasePermission):
    message = {"permission": ["You don't have permissions to perform this action."]}

    def has_permission(self, request, view):
        if not getattr(request.user, "role", False):
            return False
        if request.user.role in [User.Roles.USER,User.Roles.COMPANY,User.Roles.ASB_ADMIN]:
            return True
        


class AuthUserPerm(permissions.BasePermission):
    message = {"permission": ["You don't have permissions to perform this action."]}
    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, "role", False) or user.role not in [User.Roles.USER, User.Roles.COMPANY, User.Roles.ASB_ADMIN]:
            return False
        return True
    


class CanCreateAuthUser(permissions.BasePermission):
    message = {"permission": ["You don't have permissions to perform this action."]}
    def has_permission(self, request, view):
        user = request.user
        if user.role in [User.Roles.USER, User.Roles.COMPANY]:
            sub = user.get_subscription
            users_count = user.get_auth_users.count()
            if not sub:
                self.message = {"user": ["Subscribe to at least one plan first."]}
                return False
            if users_count >= sub.plan.users_limit:
                self.message = {"user": ["You have reached the max user limit."]}
                return False
            return True
        elif user.role == User.Roles.ASB_ADMIN:
            return True
        
        return False



class HaveSubscribe(permissions.BasePermission):
    message = {"user": ["You don't have any active subscription plan."]}

    def has_permission(self, request, view):
        if not getattr(request.user, "role", False):
            return False
        user = request.user.get_parent_or_user
        return True if user.get_subscription else False





class IsAppUser(permissions.BasePermission):
    message = {"user": ["You don't have permissions to perform this action."]}

    def has_permission(self, request, view):
        user = request.user
        if not getattr(user, "role", False) or user.role not in [User.Roles.USER, User.Roles.COMPANY, User.Roles.AUTH_USER]: 
            return False
        return True

class IsASB(permissions.BasePermission):
    message = {"user": ["You don't have permissions to perform this action."]}

    def has_permission(self, request, view):
        if not getattr(request.user, "role", False):
            return False
        user = request.user
        return True if user.role == User.Roles.ASB_ADMIN else False
    


class IsASBAuth(permissions.BasePermission):
    message = {"user": ["You don't have permissions to perform this action."]}

    def has_permission(self, request, view):
        if not getattr(request.user, "role", False):
            return False
        user = request.user
        user = user.get_parent_or_user
        return True if user.role == User.Roles.ASB_ADMIN else False