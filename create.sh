#!/bin/sh

#
# Copyright 2010, Jelte Jansen
# BSD licensed, see LICENSE for details
#

# This script creates the an xpi file (without version, rename later)
# It takes one command; the name of the source directory (and xpi file)
#
# e.g, for mailboxalert, the git repository should be in the directory
# 'mailboxalert'. Go to the directory above, and call
# create.sh mailboxalert
# It will create a file called 'mailboxalert.xpi'
#
# While building, it will create a mailboxalert_build directory
# Before starting, it will remove this directory, so make sure
# that it either does not exist, or does not contain anything else.

# check prerequisites; jar, find, 
jar --help 2>&1 > /dev/null
if [ $? != 0 ] ; then
    echo "Error, jar not found or not executable"
    exit 1;
fi;
find --help 2>&1 > /dev/null
if [ $? != 0 ] ; then
    echo "Error, find not found or not executable"
    exit 1;
fi;

ADDON=$1
BUILDDIR=${ADDON}_build
OUTPUT=${ADDON}.xpi

if [ ${ADDON} = "-h" ] ; then
    echo "Usage: create.sh <addon-name>"
    exit 0;
fi;

if [ ! -d ${ADDON} ] ; then
	echo "Error, ${ADDON} does not exist or is not a directory"
	exit 1;
fi;

rm -rf ${BUILDDIR}
cp -r ${ADDON} ${BUILDDIR}

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

