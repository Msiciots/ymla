# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models


class BasicInformation(models.Model):
    id = models.AutoField(primary_key=True)
    feature_name = models.CharField(db_column='Feature_name', max_length=9, blank=True, null=True)  # Field name made lowercase.
    standard_name = models.CharField(db_column='Standard_name', max_length=10, blank=True, null=True)  # Field name made lowercase.
    alias = models.CharField(db_column='Alias', max_length=130, blank=True, null=True)  # Field name made lowercase.
    name_description = models.CharField(db_column='Name_description', max_length=480, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'basic_information'


class DomainData(models.Model):
    id = models.AutoField(primary_key=True)
    feature_name = models.CharField(db_column='Feature_name', max_length=9, blank=True, null=True)  # Field name made lowercase.
    characteristic = models.IntegerField(db_column='Characteristic', blank=True, null=True)  # Field name made lowercase.
    domain = models.CharField(db_column='Domain', max_length=19, blank=True, null=True)  # Field name made lowercase.
    domain_description = models.CharField(db_column='Domain_description', max_length=243, blank=True, null=True)  # Field name made lowercase.
    source = models.CharField(db_column='Source', max_length=11, blank=True, null=True)  # Field name made lowercase.
    protein_coordinates = models.CharField(db_column='Protein_coordinates', max_length=9, blank=True, null=True)  # Field name made lowercase.
    interpro_entry = models.CharField(db_column='InterPro_entry', max_length=9, blank=True, null=True)  # Field name made lowercase.
    interpro_entry_description = models.CharField(db_column='InterPro_entry_description', max_length=92, blank=True, null=True)  # Field name made lowercase.
    keyword = models.CharField(db_column='Keyword', max_length=33, blank=True, null=True)  # Field name made lowercase.
    keyword_reference = models.CharField(db_column='Keyword_reference', max_length=69, blank=True, null=True)  # Field name made lowercase.
    most_probable_binding_lipid = models.CharField(db_column='Most_probable_binding_lipid', max_length=51, blank=True, null=True)  # Field name made lowercase.
    reference = models.CharField(db_column='Reference', max_length=20, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'domain_data'


class DomainTestTable(models.Model):
    id = models.AutoField(db_column='ID',primary_key=True)  # Field name made lowercase.
    domains = models.CharField(db_column='Domains', max_length=19, blank=True, null=True)  # Field name made lowercase.
    numbers = models.IntegerField(blank=True, null=True)
    feature_name = models.CharField(db_column='Feature_name', max_length=2583, blank=True, null=True)  # Field name made lowercase.
    characteristic = models.IntegerField(db_column='Characteristic', blank=True, null=True)  # Field name made lowercase.
    domain_description = models.CharField(db_column='Domain description', max_length=243, blank=True, null=True)  # Field name made lowercase. Field renamed to remove unsuitable characters.
    interpro_entry = models.CharField(db_column='InterPro entry', max_length=9, blank=True, null=True)  # Field name made lowercase. Field renamed to remove unsuitable characters.
    interpro_entry_description = models.CharField(db_column='InterPro entry description', max_length=92, blank=True, null=True)  # Field name made lowercase. Field renamed to remove unsuitable characters.
    source = models.CharField(db_column='Source', max_length=11, blank=True, null=True)  # Field name made lowercase.
    keyword = models.CharField(db_column='Keyword', max_length=33, blank=True, null=True)  # Field name made lowercase.
    keyword_reference = models.CharField(db_column='Keyword Reference', max_length=69, blank=True, null=True)  # Field name made lowercase. Field renamed to remove unsuitable characters.
    most_probable_binding_lipid = models.CharField(db_column='Most probable binding lipid', max_length=51, blank=True, null=True)  # Field name made lowercase. Field renamed to remove unsuitable characters.
    reference = models.CharField(db_column='Reference', max_length=20, blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'domain_test_table'
