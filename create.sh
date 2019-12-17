#!/bin/sh

#
# Copyright 2010, Jelte Jansen, Johannes Lange
# BSD licensed, see LICENSE for details
#

# This script creates the xpi file.

# It takes one argument: the name of the xpi file.
#
# For example, execute in this directory:
#    ./create.sh mailboxalert-XYZ.xpi
#
# It will create a file called 'mailboxalert-XYZ.xpi'
#


if [ -z $1 ]; then
    echo "Usage: create.sh <target name>";
    exit 1;
fi;

OUTPUT="${1}"
EXCLUDES="*.git* *~ .sdb _build DEADJOE TODO create.sh *.xpi"

zip -r -FS "${OUTPUT}" * --exclude ${EXCLUDES}

echo "${OUTPUT} created"

