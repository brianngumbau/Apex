from flask import Blueprint
from .auth import *

auth_bp = Blueprint('auth', __name__)