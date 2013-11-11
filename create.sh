#!/bin/sh

#
# Copyright 2010, Jelte Jansen
# BSD licensed, see LICENSE for details
#

# This script creates the an xpi file (without version, rename later)
# It takes one command; the name of the source directory (and xpi file)
#
# e.g, for mailboxalert, the git repository should be in the directory
# 'Mailbox-Alert'. Go to the directory above, and call
# create.sh Mailbox-Alert mailboxalert
# It will create a file called 'mailboxalert.xpi'
#
# (if you checked this out from github, just symlink the create.sh
# script to the upper directory)
#
# While building, it will create a mailboxalert_build directory
# Before starting, it will remove this directory, so make sure
# that it either does not exist, or does not contain anything else.

if [ -z $1 ] || [ -z $2 ]; then
    echo "Usage: create.sh <source directory> <target name>";
    exit 1;
fi;

# check prerequisites; jar, find, 
jar --help 2>&1 > /dev/null
if [ test -x `which jar` != 0 ] ; then
    echo "Error, jar not found or not executable"
    exit 1;
fi;
find --help 2>&1 > /dev/null
if [ $? != 0 ] ; then
    echo "Error, find not found or not executable"
    exit 1;
fi;

ADDON_DIR=$1
ADDON=$2
BUILDDIR=${ADDON}_build
OUTPUT=${ADDON}.xpi

if [ ! -d ${ADDON_DIR} ] ; then
	echo "Error, ${ADDON_DIR} does not exist or is not a directory"
	exit 1;
fi;

rm -rf ${BUILDDIR}
cp -r ${ADDON_DIR} ${BUILDDIR}

cd ${BUILDDIR}
# Clean out unnecessary files
find . -name .svn -exec rm -rf {} \;
find . -name .git -exec rm -rf {} \;
find . -name \*~ -exec rm -rf {} \;
find . -name DEADJOE -exec rm -rf {} \;
find . -name TODO -exec rm -rf {} \;
find . -name create.sh -exec rm -rf {} \;

# Now build the jars
cd chrome
jar -Mcvf ${ADDON}.jar content skin locale
rm -rf content
rm -rf skin
rm -rf locale
cd ../
jar -cvfM ${OUTPUT} *
mv ${OUTPUT} ../
rm -rf ${BUILDDIR}

echo "${OUTPUT} created\n";

