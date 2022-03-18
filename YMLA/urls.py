"""heatmap URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from mainPage import views

urlpatterns = [
    path('YMLA/admin/', admin.site.urls),
    path('YMLA/', views.index, name = "index"),
    path('YMLA/tool', views.tool, name = "tool"),
    path('YMLA/glossaries', views.show_glossaries, name = "glossaries"),
    path('YMLA/glossaries_detail', views.show_glossaries_detail, name = "glossaries_detail"),
    path('YMLA/download', views.download, name = "download"),
    path('YMLA/help', views.help, name = "help"),
    path('YMLA/contact', views.contact, name = "contact"),
    path('YMLA/run_analysis', views.run_analysis),
    path('YMLA/refresh_result', views.refresh_result),
    path('YMLA/show_block_detail', views.show_block_detail),
    path('YMLA/show_block_detail_ajax', views.show_block_detail_ajax),
    # path('download_intersec_genes', views.download_intersec_genes),
    # path('download_block_detail', views.download_block_detail, name = "download_block_detail"),
    path('YMLA/show_column_detail', views.show_column_detail),
    path('YMLA/show_row_detail', views.show_row_detail),
    path('YMLA/show_quant_data', views.show_quant_data),
    path('YMLA/show_custom_result', views.show_custom_result),
    path('YMLA/leave_tool', views.leave_tool),
]
