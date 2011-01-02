
if [ ! -d src_$1 ] ; then
	echo "Error, src_$1 does not exist"
	exit;
fi;
rm -rf $1
cp -r src_$1 $1

cd $1
find . -name .svn -exec rm -rf {} \;
find . -name \*~ -exec rm -rf {} \;
find . -name DEADJOE -exec rm -rf {} \;
find . -name TODO -exec rm -rf {} \;
find . -name create.sh -exec rm -rf {} \;

cd chrome
jar -Mcvf $1.jar content skin locale
rm -rf content
rm -rf skin
rm -rf locale
cd ../
jar -cvfM $1.xpi *
mv $1.xpi ../
rm -rf $1

echo "$1.xpi created\n";

